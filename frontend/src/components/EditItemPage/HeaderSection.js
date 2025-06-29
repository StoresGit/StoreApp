import React from 'react';

export default function HeaderSection({ item }) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-medium">
        Edit Item - <span className="text-green-600 font-semibold">{item?.nameEn || item?.name || 'Loading...'}</span>
      </h2>
      <button className="bg-purple-600 text-white px-4 py-1 rounded">Lock</button>
    </div>
  );
}