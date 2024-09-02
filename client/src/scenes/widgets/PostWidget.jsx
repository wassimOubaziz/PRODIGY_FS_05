import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
  TextField,
  Button,
} from "@mui/material";
import CommentFriend from "components/CommentFriend";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setPost } from "state";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  videoPath,
  userPicturePath,
  likes,
  comments: initialComments,
  handleDeletePost,
  isProfile,
}) => {
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const [isLiked, setIsLiked] = useState(Boolean(likes[loggedInUserId]));
  const [likeCount, setLikeCount] = useState(Object.keys(likes).length);

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const patchLike = async () => {
    const response = await fetch(`http://localhost:5000/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    setIsLiked(updatedPost.likes[loggedInUserId]);
    const likes = Object.keys(updatedPost.likes).length;
    setLikeCount(likes);
    dispatch(setPost({ post: updatedPost }));
  };

  const handleCommentSubmit = async () => {
    setError(null); // Clear previous error
    if (commentText.trim() === "") return; // Avoid empty comments

    // Optimistically add the comment to the UI
    const newComment = {
      user: {
        _id: loggedInUserId,
        firstName: name.split(" ")[0], // Replace with actual user data
        lastName: name.split(" ")[1],
        picturePath: userPicturePath, // Replace with actual user data
      },
      comment: commentText,
    };
    setComments([...comments, newComment]);
    setCommentText("");

    try {
      const response = await fetch(
        `http://localhost:5000/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: loggedInUserId,
            comment: commentText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to insert comment");
      }

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setComments(updatedPost.comments); // Update with the latest comments from the server
    } catch (error) {
      setError(error.message);
      // Revert the optimistic UI update
      setComments(comments.filter((c) => c !== newComment));
    }
  };

  const handleEditComment = (updatedPost) => {
    dispatch(setPost({ post: updatedPost }));
    setComments(updatedPost.comments);
  };

  const handleDeleteComment = (updatedPost) => {
    dispatch(setPost({ post: updatedPost }));
    setComments(updatedPost.comments);
  };

  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
        postId={postId}
        onDelete={handleDeletePost}
        isProfile={isProfile}
        userId={postUserId}
      />
      <Typography color={main} sx={{ mt: "1rem" }}>
        {description}
      </Typography>
      {picturePath ? (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
          src={`http://localhost:5000/assets/${picturePath}`}
        />
      ) : videoPath ? (
        <video
          width="100%"
          height="auto"
          controls
          autoPlay
          muted
          style={{
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
          src={`http://localhost:5000/assets/${videoPath}`}
        />
      ) : null}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </FlexBetween>
        </FlexBetween>

        <IconButton>
          <ShareOutlined />
        </IconButton>
      </FlexBetween>
      {isComments && (
        <Box mt="0.5rem">
          <Divider sx={{ mb: "16px" }} />
          {comments.map((c, i) => (
            <Box key={`${c.user._id}-${i}`} display="flex" alignItems="center">
              <CommentFriend
                friendId={c.user._id}
                name={`${c.user.firstName} ${c.user.lastName}`}
                subtitle={c.user.location}
                userPicturePath={c.user.picturePath}
                comment={c.comment}
                isPostOwner={postUserId === loggedInUserId}
                isCommentAuthor={c.user._id === loggedInUserId}
                postId={postId}
                commentId={c._id}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </Box>
          ))}
          <Divider />
          <Box mt="1rem">
            <TextField
              fullWidth
              variant="outlined"
              label="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: "0.5rem" }}
              onClick={handleCommentSubmit}
            >
              Send
            </Button>
            {error && (
              <Typography color="error" mt="0.5rem">
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;
