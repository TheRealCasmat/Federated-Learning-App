import React from "react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import "./FileUpload.css";

registerPlugin(
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType
);

const FileUpload = ({ files, setFiles, handleRemoveFile }) => {
  return (
    <FilePond
      files={files}
      onupdatefiles={setFiles}
      acceptedFileTypes={["image/jpeg", "image/jpg", "image/png"]}
      className="w-96"
      credits={""}
      labelIdle="Drag & Drop your image or <span class='filepond--label-action'> Browse </span>"
      instantUpload={false}
      allowProcess={false}
      onremovefile={handleRemoveFile}
    />
  );
};

export default FileUpload;
