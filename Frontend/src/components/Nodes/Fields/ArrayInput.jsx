// components/fields/ArrayInput.jsx
import { Plus, X } from "lucide-react";

export function ArrayInput({
  label,
  items,
  onChange,
  renderItem,
  newItemValue,
  addButtonLabel,
  maxItems,
  minItems = 1,
  placeholder,
}) {
  const handleAddItem = () => {
    if (maxItems && items.length >= maxItems) return;
    onChange([...items, newItemValue]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="mb-4">
      <label className="text-sm font-medium block mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) =>
          renderItem({
            item,
            index: i,
            onChange: (value) => handleItemChange(i, value),
            onRemove: () => handleRemoveItem(i),
            isRemoveDisabled: items.length <= minItems,
            placeholder: `${placeholder} ${i + 1}`,
          })
        )}
      </div>
      {(!maxItems || items.length < maxItems) && (
        <button
          onClick={handleAddItem}
          className="mt-2 text-sm text-blue-600 hover:text-blue-400 flex items-center"
        >
          <Plus className="mr-1 h-4 w-4" /> {addButtonLabel}
        </button>
      )}
    </div>
  );
}
    