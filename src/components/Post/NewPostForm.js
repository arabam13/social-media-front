import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isEmpty, timestampParser } from "../Utils";
import { NavLink } from "react-router-dom";
import { addPost, getPosts } from "../../actions/post.actions";
import storage from "../storage";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const NewPostForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState();
  const [postPicture, setPostPicture] = useState(null);
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState("");
  const userData = useSelector((state) => state.userReducer);
  const error = useSelector((state) => state.errorReducer.postError);
  const dispatch = useDispatch();

  const callStaticActions = (formData) => {
    formData = Object.fromEntries(formData);
    dispatch(addPost(formData));
    dispatch(getPosts());
    cancelPost();
  };
  const handlePost = async () => {
    if (message || video || file) {
      let formData = new FormData();
      formData.append("posterId", userData._id);

      if (message && !video && file === undefined) {
        formData.append("message", message);
        callStaticActions(formData);
      }
      if (message && video && file === undefined) {
        formData.append("message", message);
        formData.append("video", video);
        callStaticActions(formData);
      }
      if (!message && video && file === undefined) {
        formData.append("video", video);
        callStaticActions(formData);
      }
      if (file) {
        const fileName = new Date().getTime() + file.name;
        const storageRef = ref(storage, `/post/${fileName}`);
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
      }
    } else {
      alert("Veuillez entrer un message");
    }
  };

  const handlePicture = (e) => {
    // console.log(e.target.files[0]);
    e.preventDefault();
    setPostPicture(URL.createObjectURL(e.target.files[0]));
    setFile(e.target.files[0]);
    setVideo("");
  };

  const cancelPost = () => {
    setMessage("");
    setFile("");
    setPostPicture("");
    setUrl("");
    setVideo("");
  };

  useEffect(() => {
    if (!isEmpty(userData)) setIsLoading(false);

    const handleVideo = () => {
      if (message) {
        // let findLink = message.split(" ");
        // for (let i = 0; i < findLink.length; i++) {
        //   if (
        //     findLink[i].includes("https://www.yout") ||
        //     findLink[i].includes("https://yout")
        //   ) {
        //     let embed = findLink[i].replace("watch?v=", "embed/");
        //     setVideo(embed.split("&")[0]);
        //     findLink.splice(i, 1);
        //     setMessage(findLink.join(" "));
        //     setPostPicture("");
        //   }
        // }
        if (/https:\/\/www.yout|https:\/\/yout/.test(message)) {
          // setMessage(message.replace("watch?v=", "embed/"));
          const indexHttps = message.search(
            /https:\/\/www.yout|https:\/\/yout/
          );
          setVideo(message.replace("watch?v=", "embed/").slice(indexHttps));
          setMessage(
            message.replace("watch?v=", "embed/").slice(0, indexHttps)
          );
          setPostPicture("");
        }
      }
    };
    handleVideo();

    if (file && url) {
      let formData = new FormData();
      formData.append("posterId", userData._id);
      formData.append("message", message);
      formData.append("urlImage", url);
      formData.append("fileSize", file.size);
      formData.append("fileType", file.type);
      callStaticActions(formData);
    }
  }, [userData, message, video, file, url]);

  return (
    <div className="post-container">
      {isLoading ? (
        <i className="fas fa-spinner fa-pulse"></i>
      ) : (
        <React.Fragment>
          <div className="data">
            <p>
              <span>{userData.following ? userData.following.length : 0}</span>{" "}
              Abonnement
              {userData.following && userData.following.length > 1 ? "s" : null}
            </p>
            <p>
              <span>{userData.followers ? userData.followers.length : 0}</span>{" "}
              Abonné
              {userData.followers && userData.followers.length > 1 ? "s" : null}
            </p>
          </div>
          <NavLink to="/profil">
            <div className="user-info">
              <img src={userData.picture} alt="user-img" />
            </div>
          </NavLink>
          <div className="post-form">
            <textarea
              name="message"
              id="message"
              placeholder="Quoi de neuf ?"
              onChange={(e) => setMessage(e.target.value)}
              value={message}
            />
            {message || postPicture || video.length > 20 ? (
              <li className="card-container">
                <div className="card-left">
                  <img src={userData.picture} alt="user-pic" />
                </div>
                <div className="card-right">
                  <div className="card-header">
                    <div className="pseudo">
                      <h3>{userData.pseudo}</h3>
                    </div>
                    <span>{timestampParser(Date.now())}</span>
                  </div>
                  <div className="content">
                    <p>{message}</p>
                    <img src={postPicture} alt="" />
                    {video && (
                      <iframe
                        src={video}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video}
                      ></iframe>
                    )}
                  </div>
                </div>
              </li>
            ) : null}
            <div className="footer-form">
              <div className="icon">
                {isEmpty(video) && (
                  <React.Fragment>
                    <img src="./img/icons/picture.svg" alt="img" />
                    <input
                      type="file"
                      id="file-upload"
                      name="file"
                      accept=".jpg, .jpeg, .png"
                      onChange={(e) => handlePicture(e)}
                    />
                  </React.Fragment>
                )}
                {video && (
                  <button onClick={() => setVideo("")}>Supprimer video</button>
                )}
              </div>
              {!isEmpty(error.format) && <p>{error.format}</p>}
              {!isEmpty(error.maxSize) && <p>{error.maxSize}</p>}
              <div className="btn-send">
                {message || postPicture || video.length > 20 ? (
                  <button className="cancel" onClick={cancelPost}>
                    Annuler message
                  </button>
                ) : null}
                <button className="send" onClick={handlePost}>
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default NewPostForm;
