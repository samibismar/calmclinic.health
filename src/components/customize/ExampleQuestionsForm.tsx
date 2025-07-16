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
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 space-y-6 text-white">
      <h2 className="text-white font-semibold text-xl mb-4">❓ Example Questions</h2>
      <label className="block text-sm font-medium text-blue-100 mb-2">
        Add common questions patients might ask
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="e.g., What should I do before my appointment?"
        />
        <button
          onClick={addQuestion}
          className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Add
        </button>
      </div>

      {exampleQuestions.length > 0 && (
        <ul className="space-y-2">
          {exampleQuestions.map((q, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-white/5 text-white border border-white/20 px-4 py-3 rounded-lg"
            >
              <span className="text-sm">{q}</span>
              <button
                onClick={() => removeQuestion(i)}
                className="text-red-400 hover:text-red-300 text-sm hover:underline transition-colors"
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