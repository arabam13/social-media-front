import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadPicture } from "../../actions/user.actions";
import storage from "../storage";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const UploadImg = () => {
  const [file, setFile] = useState();
  const [url, setUrl] = useState("");
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.userReducer);
  // const [progress, setProgress] = useState(0);

  const handlePicture = (e) => {
    e.preventDefault();
    const fileName = userData._id + file.name;
    const storageRef = ref(storage, `/profil/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        console.log(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setUrl(url);
        });
      }
    );
  };

  useEffect(() => {
    if (url !== "" && file !== null) {
      let formData = new FormData();
      formData.append("userId", userData._id);
      formData.append("url", url);
      formData.append("fileSize", file.size);
      formData.append("fileType", file.type);
      formData = Object.fromEntries(formData);
      dispatch(uploadPicture(formData, userData._id));
    }
  }, [url, file, userData._id]);

  return (
    <form action="" onSubmit={handlePicture} className="upload-pic">
      <label htmlFor="file">Changer d'image</label>
      <input
        type="file"
        id="file"
        name="file"
        accept=".jpg, .jpeg, .png"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br />
      <input type="submit" value="Envoyer" />
    </form>
  );
};

export default UploadImg;
