import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import { useDispatch } from "react-redux";
import PostWidget from "scenes/widgets/PostWidget";
import { setPosts } from "state";

const PostPage = () => {
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const { userId, postId } = useParams();
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const dispatch = useDispatch();

  const getPost = async () => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setPost(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPost();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeletePost = (updatedPostes) => {
    dispatch(setPosts({ posts: updatedPostes }));
  };

  if (!post) return null;

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
      >
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <Box m="2rem 0" />
          <PostWidget
            key={postId}
            postId={postId}
            postUserId={userId}
            name={`${post.firstName} ${post.lastName}`}
            description={post.description}
            location={post.location}
            picturePath={post?.picturePath}
            videoPath={post?.videoPath}
            userPicturePath={post.userPicturePath}
            likes={post.likes}
            comments={post.comments}
            handleDeletePost={handleDeletePost}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PostPage;
