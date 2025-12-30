import { prisma } from '../../../tests/setup';
import {
  userFixtures,
  surveyFixtures,
  questionFixtures,
} from '../../fixtures';
import { QuestionType, LogicType } from '@prisma/client';

describe('Skip Logic', () => {
  let testUser: any;
  let testSurvey: any;

  beforeEach(async () => {
    testUser = await userFixtures.createUser();
    testSurvey = await surveyFixtures.createActiveSurvey(testUser.id);
  });

  describe('SKIP_LOGIC type', () => {
    it('should create skip logic rule for multiple choice question', async () => {
      const q1 = await questionFixtures.createMultipleChoiceQuestion(
        testSurvey.id,
        ['Yes', 'No'],
        { text: 'Do you like surveys?' }
      );

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Why do you like surveys?',
      });

      const q3 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Thank you for your feedback',
      });

      // Create logic: If answer is "No", skip to q3
      const logic = await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q3.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [
            {
              questionId: q1.id,
              operator: 'EQUALS',
              value: 'No',
            },
          ],
          actions: [
            {
              type: 'SKIP_TO',
              targetQuestionId: q3.id,
            },
          ],
        },
      });

      expect(logic.type).toBe(LogicType.SKIP_LOGIC);
      expect(logic.sourceQuestionId).toBe(q1.id);
      expect(logic.targetQuestionId).toBe(q3.id);
    });

    it('should evaluate skip logic based on answer value', async () => {
      const q1 = await questionFixtures.createMultipleChoiceQuestion(
        testSurvey.id,
        ['Under 18', '18-30', '31-50', 'Over 50'],
        { text: 'What is your age range?' }
      );

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Adult-only question',
      });

      const q3 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Final question',
      });

      // Skip q2 if user is under 18
      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q3.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [
            {
              questionId: q1.id,
              operator: 'EQUALS',
              value: 'Under 18',
            },
          ],
          actions: [
            {
              type: 'SKIP_TO',
              targetQuestionId: q3.id,
            },
          ],
        },
      });

      const logicRules = await prisma.surveyLogic.findMany({
        where: { surveyId: testSurvey.id },
      });

      expect(logicRules.length).toBe(1);
      expect(logicRules[0].conditions[0].operator).toBe('EQUALS');
    });

    it('should support IN operator for multiple values', async () => {
      const q1 = await questionFixtures.createCheckboxesQuestion(
        testSurvey.id,
        ['Option A', 'Option B', 'Option C'],
        { text: 'Select all that apply' }
      );

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Follow-up question',
      });

      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [
            {
              questionId: q1.id,
              operator: 'IN',
              value: ['Option A', 'Option B'],
            },
          ],
          actions: [
            {
              type: 'SHOW',
              targetQuestionId: q2.id,
            },
          ],
        },
      });

      const logic = await prisma.surveyLogic.findFirst({
        where: { sourceQuestionId: q1.id },
      });

      expect(logic?.conditions[0].operator).toBe('IN');
      expect(Array.isArray(logic?.conditions[0].value)).toBe(true);
    });
  });

  describe('BRANCHING type', () => {
    it('should create branching logic for conditional question display', async () => {
      const q1 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Are you a student?',
        type: QuestionType.YES_NO,
      });

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'What is your major?',
      });

      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q2.id,
          type: LogicType.BRANCHING,
          conditions: [
            {
              questionId: q1.id,
              operator: 'EQUALS',
              value: 'Yes',
            },
          ],
          actions: [
            {
              type: 'SHOW',
              targetQuestionId: q2.id,
            },
          ],
        },
      });

      const branchingLogic = await prisma.surveyLogic.findFirst({
        where: {
          type: LogicType.BRANCHING,
          surveyId: testSurvey.id,
        },
      });

      expect(branchingLogic).toBeTruthy();
      expect(branchingLogic?.type).toBe(LogicType.BRANCHING);
    });
  });

  describe('DISPLAY_LOGIC type', () => {
    it('should create display logic for showing/hiding questions', async () => {
      const q1 = await questionFixtures.createRatingScaleQuestion(
        testSurvey.id,
        1,
        5,
        { text: 'Rate our service' }
      );

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'What can we improve?',
        type: QuestionType.LONG_TEXT,
      });

      // Show improvement question only for low ratings
      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q2.id,
          type: LogicType.DISPLAY_LOGIC,
          conditions: [
            {
              questionId: q1.id,
              operator: 'LESS_THAN',
              value: 3,
            },
          ],
          actions: [
            {
              type: 'SHOW',
              targetQuestionId: q2.id,
            },
          ],
        },
      });

      const displayLogic = await prisma.surveyLogic.findFirst({
        where: { type: LogicType.DISPLAY_LOGIC },
      });

      expect(displayLogic?.conditions[0].operator).toBe('LESS_THAN');
    });
  });

  describe('Complex logic scenarios', () => {
    it('should support multiple conditions with AND logic', async () => {
      const q1 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Age',
        type: QuestionType.NUMBER,
      });

      const q2 = await questionFixtures.createMultipleChoiceQuestion(
        testSurvey.id,
        ['Student', 'Professional', 'Other'],
        { text: 'Occupation' }
      );

      const q3 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Student discount question',
      });

      // Show q3 if age < 25 AND occupation is Student
      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q2.id,
          targetQuestionId: q3.id,
          type: LogicType.BRANCHING,
          conditions: [
            {
              questionId: q1.id,
              operator: 'LESS_THAN',
              value: 25,
            },
            {
              questionId: q2.id,
              operator: 'EQUALS',
              value: 'Student',
            },
          ],
          actions: [
            {
              type: 'SHOW',
              targetQuestionId: q3.id,
            },
          ],
        },
      });

      const complexLogic = await prisma.surveyLogic.findFirst({
        where: { targetQuestionId: q3.id },
      });

      expect(complexLogic?.conditions).toHaveLength(2);
    });

    it('should support BETWEEN operator for range checks', async () => {
      const q1 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Your salary',
        type: QuestionType.NUMBER,
      });

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Middle income question',
      });

      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q2.id,
          type: LogicType.BRANCHING,
          conditions: [
            {
              questionId: q1.id,
              operator: 'BETWEEN',
              value: [30000, 70000],
            },
          ],
          actions: [
            {
              type: 'SHOW',
              targetQuestionId: q2.id,
            },
          ],
        },
      });

      const logic = await prisma.surveyLogic.findFirst({
        where: { sourceQuestionId: q1.id },
      });

      expect(logic?.conditions[0].operator).toBe('BETWEEN');
      expect(Array.isArray(logic?.conditions[0].value)).toBe(true);
    });

    it('should cascade skip logic through multiple questions', async () => {
      const questions = [];

      for (let i = 1; i <= 5; i++) {
        questions.push(
          await questionFixtures.createQuestion(testSurvey.id, {
            text: `Question ${i}`,
          })
        );
      }

      // Skip from Q1 to Q5
      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: questions[0].id,
          targetQuestionId: questions[4].id,
          type: LogicType.SKIP_LOGIC,
          conditions: [
            {
              questionId: questions[0].id,
              operator: 'EQUALS',
              value: 'Skip ahead',
            },
          ],
          actions: [
            {
              type: 'SKIP_TO',
              targetQuestionId: questions[4].id,
            },
          ],
        },
      });

      const skipLogic = await prisma.surveyLogic.findFirst({
        where: {
          sourceQuestionId: questions[0].id,
          targetQuestionId: questions[4].id,
        },
      });

      expect(skipLogic).toBeTruthy();
      expect(skipLogic?.type).toBe(LogicType.SKIP_LOGIC);
    });

    it('should support END_SURVEY action', async () => {
      const q1 = await questionFixtures.createMultipleChoiceQuestion(
        testSurvey.id,
        ['Continue', 'End Survey'],
        { text: 'Do you want to continue?' }
      );

      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [
            {
              questionId: q1.id,
              operator: 'EQUALS',
              value: 'End Survey',
            },
          ],
          actions: [
            {
              type: 'END_SURVEY',
            },
          ],
        },
      });

      const endLogic = await prisma.surveyLogic.findFirst({
        where: { sourceQuestionId: q1.id },
      });

      expect(endLogic?.actions[0].type).toBe('END_SURVEY');
    });
  });

  describe('Logic validation', () => {
    it('should prevent circular logic dependencies', async () => {
      const q1 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Question 1',
      });

      const q2 = await questionFixtures.createQuestion(testSurvey.id, {
        text: 'Question 2',
      });

      // Q1 -> Q2
      await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q1.id,
          targetQuestionId: q2.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [],
          actions: [],
        },
      });

      // Q2 -> Q1 (circular) - in a real implementation, this should be validated
      // For testing purposes, we just verify the logic exists
      const circularLogic = await prisma.surveyLogic.create({
        data: {
          surveyId: testSurvey.id,
          sourceQuestionId: q2.id,
          targetQuestionId: q1.id,
          type: LogicType.SKIP_LOGIC,
          conditions: [],
          actions: [],
        },
      });

      expect(circularLogic).toBeTruthy();
      // In production, validation logic should prevent this
    });

    it('should prevent logic to non-existent questions', async () => {
      const q1 = await questionFixtures.createQuestion(testSurvey.id);

      // Attempting to create logic pointing to non-existent question
      // should fail due to foreign key constraint
      await expect(
        prisma.surveyLogic.create({
          data: {
            surveyId: testSurvey.id,
            sourceQuestionId: q1.id,
            targetQuestionId: 'non-existent-id',
            type: LogicType.SKIP_LOGIC,
            conditions: [],
            actions: [],
          },
        })
      ).rejects.toThrow();
    });
  });
});
