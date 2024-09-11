import React from "react";

const IdentifyButton = ({ isLoading, isIdentified }) => {
  return (
    <button
      type="submit"
      className={`btn btn-primary w-96 ${isLoading && "btn-primary:disabled"}`}
      disabled={isLoading || isIdentified}
    >
      {isLoading ? (
        <span
          className="loading loading-spinner"
          style={{ color: "#050617" }}
        />
      ) : isIdentified ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="#050617"
          className="size-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ) : (
        "Identify"
      )}
    </button>
  );
};

export default IdentifyButton;
