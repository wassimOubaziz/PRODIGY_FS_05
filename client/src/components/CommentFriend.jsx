import {
  Box,
  Typography,
  useTheme,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import CancelOutlined from "@mui/icons-material/CancelOutlined";
import { useState } from "react";

import axios from "axios";
import { useSelector } from "react-redux";

const CommentFriend = ({
  friendId,
  name,
  subtitle,
  userPicturePath,
  comment,
  commentId,
  postId,
  isPostOwner,
  isCommentAuthor,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const light = palette.neutral.light;
  const primaryLight = palette.primary.light;
  const darkBackground =
    palette.mode === "dark" ? palette.background.paper : light;
  const darkText = palette.mode === "dark" ? palette.text.primary : main;
  const token = useSelector((state) => state.token);

  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment);
  const [error, setError] = useState("");

  const handleEdit = async () => {
    if (!editedComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    try {
      // Make API call to edit comment
      const { data: updatedPost } = await axios.patch(
        `http://localhost:5000/posts/${postId}/comments/${commentId}`,
        {
          comment: editedComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (onEdit) {
        onEdit(updatedPost);
      }
      setIsEditing(false);
      setError("");
    } catch (err) {
      setError("Failed to edit comment");
    }
  };

  const handleDelete = async () => {
    try {
      // Make API call to delete comment
      const { data: updatedPost } = await axios.delete(
        `http://localhost:5000/posts/${postId}/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (onDelete) {
        onDelete(updatedPost);
      }
    } catch (err) {
      setError("Failed to delete comment");
    }
  };

  return (
    <Box
      p="1rem"
      borderRadius="12px"
      backgroundColor={light}
      mb="1rem"
      display="flex"
      flexDirection="column"
      width="100%"
    >
      <FlexBetween alignItems="center" gap="0.75rem" width="100%">
        {/* User Image and Info */}
        <Box display="flex" alignItems="center" gap="0.75rem" flexGrow={1}>
          <UserImage image={userPicturePath} size="45px" />
          <Box
            onClick={() => {
              navigate(`/profile/${friendId}`);
              navigate(0);
            }}
            sx={{
              flexGrow: 1,
              cursor: "pointer",
            }}
          >
            <Typography
              color={main}
              variant="h6"
              fontWeight="500"
              sx={{
                "&:hover": {
                  color: primaryLight,
                },
              }}
            >
              {name}
            </Typography>
            <Typography color={medium} fontSize="0.8rem">
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Icons */}
        {(isPostOwner || isCommentAuthor) && !isEditing && (
          <Box display="flex">
            {isCommentAuthor && (
              <IconButton onClick={() => setIsEditing(true)}>
                <EditOutlined />
              </IconButton>
            )}
            {(isPostOwner || isCommentAuthor) && (
              <IconButton onClick={handleDelete}>
                <DeleteOutlineOutlined />
              </IconButton>
            )}
          </Box>
        )}
      </FlexBetween>

      {/* Comment Section */}
      <Box mt="0.75rem">
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              variant="outlined"
              label="Edit comment..."
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              multiline
              rows={3}
              sx={{
                borderRadius: "8px",
                backgroundColor: darkBackground,
                color: darkText,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": {
                    borderColor: palette.divider,
                  },
                  "&:hover fieldset": {
                    borderColor: primaryLight,
                  },
                },
                "& .MuiInputBase-input": {
                  color: darkText,
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: "0.5rem" }}
              onClick={handleEdit}
            >
              Save
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ mt: "0.5rem" }}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            {error && (
              <Typography color="error" mt="0.5rem">
                {error}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography
            sx={{
              color: main,
              backgroundColor: palette.background.paper,
              padding: "0.75rem",
              borderRadius: "12px",
              boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
              lineHeight: 1.5,
              wordWrap: "break-word",
            }}
          >
            {comment}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CommentFriend;
