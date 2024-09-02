import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";

const PostsWidget = ({ userId, isProfile = false, isTrending }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    const response = await fetch("http://localhost:5000/posts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    dispatch(setPosts({ posts: data.reverse() }));
  };

  const getUserPosts = async () => {
    const response = await fetch(
      `http://localhost:5000/posts/${userId}/posts`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setPosts({ posts: data.reverse() }));
  };

  const handleDeletePost = (updatedPosts) => {
    dispatch(setPosts({ posts: updatedPosts.reverse() }));
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, [isProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort posts if isTrending is true
  const sortedPosts = isTrending
    ? [...posts].sort(
        (a, b) => Object.keys(b.likes).length - Object.keys(a.likes).length
      )
    : posts;

  return (
    <>
      {sortedPosts?.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          videoPath,
          userPicturePath,
          likes,
          comments,
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            videoPath={videoPath}
            userPicturePath={userPicturePath}
            likes={likes}
            comments={comments}
            handleDeletePost={handleDeletePost}
            isProfile={isProfile}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
