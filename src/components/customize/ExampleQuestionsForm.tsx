"use client";

import React from "react";

type Props = {
  exampleQuestions: string[];
  setExampleQuestions: (val: string[]) => void;
  newQuestion: string;
  setNewQuestion: (val: string) => void;
};

const ExampleQuestionsForm = ({
  exampleQuestions,
  setExampleQuestions,
  newQuestion,
  setNewQuestion,
}: Props) => {
  const addQuestion = () => {
    if (newQuestion.trim()) {
      setExampleQuestions([...exampleQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    const updated = [...exampleQuestions];
    updated.splice(index, 1);
    setExampleQuestions(updated);
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-6 text-white">
      <h2 className="text-white font-semibold text-xl mb-4">❓ Example Questions</h2>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Add common questions patients might ask
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500"
          placeholder="e.g., What should I do before my appointment?"
        />
        <button
          onClick={addQuestion}
          className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
        >
          Add
        </button>
      </div>

      {exampleQuestions.length > 0 && (
        <ul className="space-y-2">
          {exampleQuestions.map((q, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-[#1e293b] text-white border border-gray-700 px-4 py-2 rounded-md"
            >
              <span className="text-sm">{q}</span>
              <button
                onClick={() => removeQuestion(i)}
                className="text-red-500 hover:underline text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExampleQuestionsForm;