import React from 'react';
import { Slot } from '../services/api';

interface SlotPickerProps {
  slots: Slot[];
  value: string;
  onChange: (slotId: string) => void;
}

const SlotPicker: React.FC<SlotPickerProps> = ({ slots, value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Select a slot</option>
      {slots.map(slot => (
        <option key={slot.id} value={slot.id}>
          {slot.subject} · {slot.time} · {slot.groups.join(', ')}
        </option>
      ))}
    </select>
  );
};

export default SlotPicker;
