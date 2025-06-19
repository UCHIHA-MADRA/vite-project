import React, { useId } from 'react';

function Select({ options, label, className, ...props }, ref) {
  const id = useId();

  return (
    <div className='w-full'>
      {label && (
        <label htmlFor={id} className='block mb-1'>
          {label}
        </label>
      )}
      <select
        {...props}
        id={id}
        className={className}
        ref={ref}
      >
        {options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default React.forwardRef(Select);
