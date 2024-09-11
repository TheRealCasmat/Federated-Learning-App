import React from "react";

const Dialog = ({ id, title, text, command, callback }) => {
  return (
    <dialog id={id} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{text}</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-error mr-4" onClick={callback}>
              {command}
            </button>
            <button className="btn">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default Dialog;
