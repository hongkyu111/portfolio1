import User from "../models/User";
import Video from "../models/video";
import fetch from "node-fetch";
import bcrypt  from "bcrypt";


export const getJoin = (req, res) => 
    res.render("join", {pageTitle: "Join"});

export const postJoin = async (req, res) => {
    const { name, username, email,password,password_2, location } = req.body;
    const pageTitle = "Join";
    if(password !== password_2){
        return res.status(400).render("join", {
         pageTitle,
         errorMessage:"Password confrim does not match.",
         });
    }
    const exists = await User.exists({ $or: [{username}, {email}] });
    if(exists){
        return res.status(400).render("join", {
         pageTitle,
         errorMessage:"This Username/Email is already taken.",
         });
    }
    try{
        await User.create({
            name,
            username,
            email,
            password,
            location,
        });
        return res.redirect("/login");
    } catch(error) {
        return res.status(400).render("join", {
        pageTitle: "Join", 
        errorMessage: error._message,
        });
    }
};

export const getLogin = (req, res) => res.render("login", {pageTitle: "Log in"});

export const postLogin = async(req, res) => {
    const { username, password } = req.body;
    const pageTitle = "Log in";
    const user = await User.findOne({username, socialOnly: false});
    if(!user){
        return res
        .status(400)
        .render("login",{
        pageTitle,
        errorMessage: "An account with this username dose not exists.",
        });
    }
    const ok = await bcrypt.compare(password, user.password);
    if(!ok){
        return res
        .status(400)
        .render("login",{
        pageTitle,
        errorMessage: "Wrong Password",
        });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
};


//깃헙 로그인 
export const startGithubLogin = (req, res) => {
    const baseUrl=`https://github.com/login/oauth/authorize`;
    const config = {
        client_id: process.env.GH_CLIENT,
        allow_signup: false, 
        scope:"read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl=`${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
        await fetch(finalUrl, {
        method: "POST",
        headers:{
            Accept: "application/json",
        },
     })
    ).json();
    if("access_token" in tokenRequest) {
        const {access_token} = tokenRequest;
        const apiUrl = "https://api.github.com";
        const userData = await (
            await fetch(`${apiUrl}/user`, {
            headers: {
                Authorization: `token ${access_token}`,
            },
        })
    ).json();
    console.log(userData);
    const emailData = await (
        await fetch(`${apiUrl}/user/emails`, {
            headers: {
                Authorization: `token ${access_token}`,
            },
        })
    ).json();
    console.log(emailData);

    const emailObj = emailData.find(
        (email) => email.primary === true && email.verified === true
    );
    if(!emailObj){
        return res.redirect("/login");
     }
     let user = await User.findOne({email: emailObj.email});
     if(!user){  
        user = await User.create({
            avatarUrl: userData.avatar_url,
            name: userData.name,
            username: userData.login,
            email: emailObj.email,
            password: "",
            socialOnly: true,
            location: userData.location,
        });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
    } else {
        return res.redirect("/login");
    }
};

export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/");
};


export const getEdit = (req, res) => {
    return res.render("edit-profile", { pageTitle: " Edit Profile " });
};

export const postEdit = async (req, res) =>{
    const { 
        session: { 
            user: { _id, email: sessionEmail, username: sessionUsername, avatarUrl },
        },
        body: { name, email, username, location },
        file,
    } = req;
    
    let searchParam = [];
    if(sessionEmail !== email ){   
        searchParam.push({email});
    }
    if(sessionUsername !== username){
        searchParam.push({username});
    }
    if(searchParam.length > 0){
        const foundUser = await User.findOne({ $or: searchParam });
        if(foundUser && foundUser._id.toString() !== _id ){
            return res.status(400).render("edit-profile",{
                pageTitle: "Edit-Profile",
                errorMessage: "이미 존재하는 username, email 입니다",
                });
        }
    }
   const updatedUser =  await User.findByIdAndUpdate(
    _id, {
        avatarUrl: file ? file.path : avatarUrl,
        name,
        email,
        username,
        location, 
    },
     {new: true }
    );
    req.session.user = updatedUser;
    return res.redirect("/user/edit");
};

export const getChangePassword = (req, res) => {
    if(req.session.user.socialOnly === true) {
       return res.redirect("/");
    }
    return res.render("user/change-password", { pageTitle: "Chaange Password" });
};

export const postChangePassword = async(req, res) => {
    const { 
        session: { 
            user: { _id }, 
        },
        body: { oldPassword, newPassword, newPassword1 }
    } = req;

    const user = await User.findById(_id);
    const ok = await bcrypt.compare(oldPassword, user.password);
    if(!ok){
        return res.status(400).render("user/change-password",{ 
           pageTitle: "Chaange Password",
           errorMessage: "현재 비밀번호가 틀렸습니다.",
     });
    }

    if(newPassword !== newPassword1){
         return res.status(400).render("user/change-password",
          { pageTitle: "Chaange Password",
           errorMessage: "새비밀번호와 확인비밀번호가 같지 않습니다.",
        });
    }
    user.password = newPassword;
    await user.save();
    return res.redirect("/user/logout");
};

export const see = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("videos");
    console.log(user);
    if(!user){
        return res.status(400).render("404", {pageTitle:"User not found."});
    }
    return res.render("user/profile", {
        pageTitle: user.name,
        user,
    });
};


/* es6 가 없을경우
    fetch(finalUrl, {
        method: "POST",
        headers:{
            Accept: "application/json",
        },
     })
     .then((response) => response.json())
     .then((json) => {
        if("access_token" in json) {
            const {access_token} = tokenRequest;
            const apiUrl = "https://api.github.com";
            fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            }).then(response => response.json()).then(json => {
                    ~~~~~
            });
     })
*/