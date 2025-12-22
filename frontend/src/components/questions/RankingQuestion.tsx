import { useState, useEffect } from 'react';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { Question } from '../../types';
import { StrictModeDroppable } from './StrictModeDroppable';

interface RankingQuestionProps {
    question: Question;
    onChange?: (value: any) => void;
    value?: any;
    disabled?: boolean;
}

export default function RankingQuestion({
    question,
    onChange,
    value,
    disabled = false,
}: RankingQuestionProps) {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        // Initialize items from options
        // If we have a value (saved order), use that to sort options
        // Otherwise use default order
        if (question.options) {
            if (value?.optionIds && Array.isArray(value.optionIds)) {
                const orderedItems = value.optionIds
                    .map((id: string) => question.options.find(opt => opt.id === id))
                    .filter(Boolean);

                // Add any missing items (in case options changed)
                const missingItems = question.options.filter(
                    opt => !value.optionIds.includes(opt.id)
                );

                setItems([...orderedItems, ...missingItems]);
            } else {
                setItems([...question.options]);
            }
        }
    }, [question.options, value]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || disabled) return;

        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        setItems(newItems);

        // Send array of option IDs as value
        onChange?.({ optionIds: newItems.map(item => item.id) });
    };

    if (!question.options || question.options.length === 0) {
        return <div className="text-gray-500 italic">No items to rank</div>;
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId={`ranking-${question.id}`}>
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                    >
                        {items.map((item, index) => (
                            <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}
                                isDragDisabled={disabled}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : 'hover:border-primary-300'
                                            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="text-gray-400 shrink-0">
                                            <GripVertical size={16} />
                                        </div>
                                        <span className="text-gray-700 font-medium select-none flex-grow">
                                            {item.text}
                                        </span>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </StrictModeDroppable>
        </DragDropContext>
    );
}
