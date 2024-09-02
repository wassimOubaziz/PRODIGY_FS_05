import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  EditOutlined,
  DeleteOutlined,
  AttachFileOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MoreHorizOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  InputBase,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Dropzone from "react-dropzone";
import FlexBetween from "components/FlexBetween";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { setPosts } from "state";
import axios from "axios";

const MyPostWidget = ({ picturePath, isProfile }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [post, setPost] = useState("");
  const [mentionAnchor, setMentionAnchor] = useState(null);
  const [tags, setTags] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const [charCount, setCharCount] = useState(500);

  const handlePost = async () => {
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("description", post);
    formData.append("tags", JSON.stringify(tags));

    if (image) {
      formData.append("picture", image);
      formData.append("picturePath", image.name);
    }
    if (video) {
      formData.append("picture", video);
      formData.append("videoPath", video.name);
    }

    let response;
    if (!isProfile) {
      response = await fetch(`http://localhost:5000/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } else {
      response = await fetch(`http://localhost:5000/posts/profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }
    let posts = await response.json();
    posts = posts.reverse();
    dispatch(setPosts({ posts }));
    setImage(null);
    setVideo(null);
    setPost("");
    setIsImage(false);
    setIsVideo(false);
    setTags([]);
    setCharCount(500); // Reset character count after posting
  };

  const handleInputChange = async (e) => {
    const inputValue = e.target.value;
    setPost(inputValue);
    setCharCount(500 - inputValue.length);

    const mentionTrigger = inputValue.split(" ").pop();
    if (mentionTrigger.startsWith("#")) {
      setMentionAnchor(e.currentTarget);
      const mentionSearch = mentionTrigger.substring(1);

      try {
        const response = await axios.get(
          `http://localhost:5000/users/search/${mentionSearch}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.status === 200) {
          setFilteredUsers(response.data);
        } else {
          console.error("Error fetching users:", response.statusText);
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setFilteredUsers([]);
      }
    } else {
      setMentionAnchor(null);
      setFilteredUsers([]);
    }
  };

  const handleMentionClick = (user) => {
    const words = post.split(" ");
    words.pop();

    let newTags = new Set([...tags, user._id]);
    setTags([...newTags]);

    words.push(`#${user.firstName}`);
    setPost(words.join(" ") + " ");
    setMentionAnchor(null);
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <Box sx={{ width: "100%", position: "relative" }}>
          <InputBase
            placeholder="What's on your mind..."
            onChange={handleInputChange}
            value={post}
            sx={{
              width: "100%",
              backgroundColor: palette.neutral.light,
              borderRadius: "2rem",
              padding: "1rem 2rem",
              color: palette.text.primary,
            }}
          />
          <Typography
            color={palette.neutral.mediumMain}
            sx={{ marginTop: "0.5rem" }}
          >
            {charCount} characters remaining
          </Typography>
          <Popper
            open={Boolean(mentionAnchor) && filteredUsers.length > 0}
            anchorEl={mentionAnchor}
            placement="bottom-start"
            sx={{ zIndex: 9999 }}
          >
            <Paper>
              <List>
                {Array.isArray(filteredUsers) ? (
                  filteredUsers.map((user) => (
                    <ListItem
                      button
                      key={user._id}
                      onClick={() => handleMentionClick(user)}
                    >
                      <ListItemText primary={`#${user.firstName}`} />
                    </ListItem>
                  ))
                ) : (
                  <Typography>No users found</Typography>
                )}
              </List>
            </Paper>
          </Popper>
        </Box>
      </FlexBetween>

      {isImage && (
        <Box
          border={`1px solid ${palette.neutral.medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles=".jpg,.jpeg,.png"
            multiple={false}
            onDrop={(acceptedFiles) => setImage(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <p>Add Image Here</p>
                  ) : (
                    <FlexBetween>
                      <Typography>{image.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {image && (
                  <IconButton
                    onClick={() => setImage(null)}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      {isVideo && (
        <Box
          border={`1px solid ${palette.neutral.medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles=".mp4,.mov,.avi,.mkv"
            multiple={false}
            onDrop={(acceptedFiles) => setVideo(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!video ? (
                    <p>Add Video Here</p>
                  ) : (
                    <FlexBetween>
                      <Typography>{video.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {video && (
                  <IconButton
                    onClick={() => setVideo(null)}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween gap="0.25rem" onClick={() => setIsImage(!isImage)}>
          <ImageOutlined sx={{ color: palette.neutral.mediumMain }} />
          <Typography
            color={palette.neutral.mediumMain}
            sx={{
              "&:hover": { cursor: "pointer", color: palette.neutral.medium },
            }}
          >
            Image
          </Typography>
        </FlexBetween>

        <FlexBetween gap="0.25rem" onClick={() => setIsVideo(!isVideo)}>
          <GifBoxOutlined sx={{ color: palette.neutral.mediumMain }} />
          <Typography
            color={palette.neutral.mediumMain}
            sx={{
              "&:hover": { cursor: "pointer", color: palette.neutral.medium },
            }}
          >
            Video
          </Typography>
        </FlexBetween>

        <Button
          disabled={charCount < 0}
          onClick={handlePost}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: "2rem",
            padding: "0.5rem 1.5rem",
            "&:hover": {
              backgroundColor: palette.primary.dark,
            },
          }}
        >
          POST
        </Button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;
