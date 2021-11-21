import Video from "../models/video";
import User from "../models/User";

// 메인 페이지 기능
export const home = async(req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
    return res.render("home", { pageTitle: "Home", videos });
};

// 영상 메인 페이지 기능
export const watch = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id).populate("owner");
    if(!video){
      return res.status(404).render("404", { pageTitle: "Video not found." });
    }else{
      return res.render("watch", { pageTitle: video.title, video });   
    }
};

// 영상 수정(받는) 기능
export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: {_id},
  } = req.session; 
  const video = await Video.findById(id);
  if(!video){
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if(String(video.owner) !== String(_id)){
    return res.status(403).redirect("/");
  }
    return res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
};

// 영상 수정(보내기) 기능
export const postEdit = async (req, res) =>{
  const { id } = req.params;
  const {title, description,hashtags} = req.body;
  const {
    user: {_id},
  } = req.session; 
  const video = await Video.exists({ _id: id });
  if(!video){
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if(String(video.owner) !== String(_id)){
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  })
  video.title = title;
  video.description = description;
  video.hashtags = hashtags
    .split(",")
    .map((word) => (word.startsWith('#') ? word : `#${word}`));
  await video.save();
  return res.redirect(`/video/${id}`);
};

// 영상 업로드(받기) 기능
export const getUpload = (req, res) => {
  return res.render("upload", {pageTitle: "Upload Video"});
};

// 영상 업로드(보내기) 기능
// 영상크기가 클때는 업로드가 느리니 에러가아니고 걍 컴퓨터가 개같이 느린것이다 
export const postUpload = async(req,res) => {
  const {user: {_id}} = req.session;
  const { path: fileUrl } = req.file;
  const {title, description, hashtags} = req.body;
try{
  const newVideo = await Video.create({
    title,
    description,
    fileUrl,
    owner:_id,
    hashtags: Video.formatHashtags(hashtags),
  });
  const user = await User.findById(_id);
  user.videos.push(newVideo._id);
  user.save();
  return res.redirect("/");
  } catch(error){
    return res.status(400).render("upload", {
    pageTitle: "Upload Video", 
    errorMessage: error._message,
  });
  }
};


// 지우는 기능
export const deleteVideo = async(req, res) => {
  const { id } = req.params;
  const {
    user: {_id},
  } = req.session; 
  const video = await Video.findById(id);
  if(!video){
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if(String(video.owner) !== String(_id)){
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

//검색기능
export const search = async(req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
     videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}$`, "i"),
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle:"Search", videos });
}

