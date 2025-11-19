/**
 * Database Seed Script
 * Populates the database with initial data
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✓ Created admin user: ${admin.email}`);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.MANAGER,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✓ Created demo user: ${demoUser.email}`);

  // Create a sample workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Default Workspace',
      description: 'Your default workspace for organizing surveys',
      members: {
        create: [
          {
            userId: admin.id,
            role: UserRole.ADMIN,
          },
          {
            userId: demoUser.id,
            role: UserRole.MANAGER,
          },
        ],
      },
    },
  });

  console.log(`✓ Created workspace: ${workspace.name}`);

  // Create a sample survey template
  const template = await prisma.surveyTemplate.create({
    data: {
      name: 'Customer Satisfaction Survey',
      category: 'Customer Feedback',
      description: 'A comprehensive template for measuring customer satisfaction',
      isPublic: true,
      content: {
        title: 'Customer Satisfaction Survey',
        description: 'Help us improve by sharing your feedback',
        questions: [
          {
            type: 'RATING_SCALE',
            text: 'How satisfied are you with our product/service?',
            isRequired: true,
            settings: {
              minValue: 1,
              maxValue: 5,
              minLabel: 'Very Dissatisfied',
              maxLabel: 'Very Satisfied',
            },
          },
          {
            type: 'NPS',
            text: 'How likely are you to recommend us to a friend or colleague?',
            isRequired: true,
            settings: {
              minValue: 0,
              maxValue: 10,
              minLabel: 'Not at all likely',
              maxLabel: 'Extremely likely',
            },
          },
          {
            type: 'MULTIPLE_CHOICE',
            text: 'What is your primary reason for choosing our product/service?',
            isRequired: false,
            options: [
              'Price',
              'Quality',
              'Customer Service',
              'Features',
              'Brand Reputation',
              'Other',
            ],
          },
          {
            type: 'LONG_TEXT',
            text: 'What can we do to improve your experience?',
            isRequired: false,
          },
        ],
      },
      createdBy: admin.id,
    },
  });

  console.log(`✓ Created survey template: ${template.name}`);

  // Create question bank entries
  const questionBankData = [
    {
      category: 'Customer Satisfaction',
      type: 'RATING_SCALE',
      text: 'How satisfied are you with our service?',
      options: {
        minValue: 1,
        maxValue: 5,
        minLabel: 'Very Dissatisfied',
        maxLabel: 'Very Satisfied',
      },
    },
    {
      category: 'Customer Satisfaction',
      type: 'NPS',
      text: 'How likely are you to recommend us?',
      options: {
        minValue: 0,
        maxValue: 10,
      },
    },
    {
      category: 'Product Feedback',
      type: 'MULTIPLE_CHOICE',
      text: 'Which feature do you use most often?',
      options: {
        choices: ['Feature A', 'Feature B', 'Feature C', 'Other'],
      },
    },
    {
      category: 'Product Feedback',
      type: 'LONG_TEXT',
      text: 'What new features would you like to see?',
    },
    {
      category: 'Employee Engagement',
      type: 'LIKERT_SCALE',
      text: 'I feel valued and appreciated at work',
      options: {
        choices: [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree',
        ],
      },
    },
    {
      category: 'Employee Engagement',
      type: 'RATING_SCALE',
      text: 'How would you rate your work-life balance?',
      options: {
        minValue: 1,
        maxValue: 10,
      },
    },
  ];

  for (const question of questionBankData) {
    await prisma.questionBank.create({
      data: {
        category: question.category,
        type: question.type as any,
        text: question.text,
        options: question.options,
      },
    });
  }

  console.log(`✓ Created ${questionBankData.length} question bank entries`);

  // Create platform branding
  const branding = await prisma.platformBranding.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      platformName: 'PulseGen',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      accentColor: '#10B981',
      footerText: '© 2024 PulseGen. All rights reserved.',
      supportEmail: adminEmail,
      showPoweredBy: true,
    },
  });

  console.log(`✓ Created platform branding: ${branding.platformName}`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • Admin User: ${adminEmail}`);
  console.log(`   • Demo User: demo@example.com`);
  console.log(`   • Workspace: ${workspace.name}`);
  console.log(`   • Survey Templates: 1`);
  console.log(`   • Question Bank: ${questionBankData.length} questions`);
  console.log('\n🔐 Default Passwords:');
  console.log(`   • Admin: ${adminPassword}`);
  console.log(`   • Demo: demo123`);
  console.log('\n⚠️  Remember to change these passwords in production!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
