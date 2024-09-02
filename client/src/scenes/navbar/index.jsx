import { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";
import {
  Search,
  Message,
  DarkMode,
  LightMode,
  Help,
  Menu,
  Close,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import io from "socket.io-client";
import { toast } from "react-toastify";
import axios from "axios";

const socket = io("http://localhost:5000");

const customToast = (message, navigate) => {
  toast.info(
    <div className="custom-toast">
      <div className="toast-content">
        <span>{message.message}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "#4A4A4A", // Example color for the text
            padding: "10px",
            backgroundColor: "#F5F7F9", // Example background color
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
          onClick={() => navigate(`/post/${message.userId}/${message.postId}`)}
        >
          <strong
            style={{
              fontWeight: "bold",
              color: "#D0021B", // Example color for the link
              marginLeft: "5px",
            }}
          >
            Check it out
          </strong>
        </div>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
};

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [postSuggestions, setPostSuggestions] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const primaryLight = theme.palette.primary.light;
  const alt = theme.palette.background.alt;

  const fullName = `${user.firstName} ${user.lastName}`;

  useEffect(() => {
    socket.on("notification", (message) => {
      customToast(message, navigate);
    });

    socket.emit("registerSocket", { userId: user._id });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSuggestions = async (query) => {
    console.log(query);
    try {
      const response = await axios.get(
        `http://localhost:5000/posts/best/search`,
        {
          params: { query },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserSuggestions(response.data.users);
      setPostSuggestions(response.data.posts);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      fetchSuggestions(query);
    } else {
      setUserSuggestions([]);
      setPostSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "user") {
      navigate(`/profile/${suggestion._id}`);
    } else if (suggestion.type === "post") {
      navigate(`/post/${suggestion.userId}/${suggestion._id}`);
    }
    setSearchQuery("");
    setUserSuggestions([]);
    setPostSuggestions([]);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/home?query=${searchQuery}`);
    }
  };

  return (
    <FlexBetween padding="1rem 6%" backgroundColor={alt}>
      <FlexBetween gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{
            "&:hover": {
              color: primaryLight,
              cursor: "pointer",
            },
          }}
        >
          LinkUp
        </Typography>
        {isNonMobileScreens && (
          <FlexBetween
            backgroundColor={neutralLight}
            borderRadius="9px"
            gap="3rem"
            padding="0.1rem 1.5rem"
            position="relative"
          >
            <InputBase
              placeholder="Search ..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <IconButton onClick={handleSearch}>
              <Search />
            </IconButton>
            {(userSuggestions.length > 0 || postSuggestions.length > 0) && (
              <Paper
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <List>
                  {userSuggestions.map((user) => (
                    <ListItem
                      button
                      key={user._id}
                      onClick={() =>
                        handleSuggestionClick({ type: "user", ...user })
                      }
                    >
                      <ListItemText
                        primary={`${user.firstName} ${user.lastName}`}
                      />
                    </ListItem>
                  ))}
                  {postSuggestions.map((post) => (
                    <ListItem
                      button
                      key={post._id}
                      onClick={() =>
                        handleSuggestionClick({
                          type: "post",
                          ...post,
                          userId: post.userId,
                        })
                      }
                    >
                      <ListItemText
                        primary={post.description}
                        secondary="Continue..."
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </FlexBetween>
        )}
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="2rem">
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: "25px" }} />
            )}
          </IconButton>
          <Message sx={{ fontSize: "25px" }} />
          <Help sx={{ fontSize: "25px" }} />
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
                "& .MuiSvgIcon-root": {
                  pr: "0.25rem",
                  width: "3rem",
                },
                "& .MuiSelect-select:focus": {
                  backgroundColor: neutralLight,
                },
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Log Out</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton
          onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
        >
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          zIndex="10"
          maxWidth="500px"
          minWidth="300px"
          backgroundColor={background}
        >
          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end" p="1rem">
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap="3rem"
          >
            <IconButton
              onClick={() => dispatch(setMode())}
              sx={{ fontSize: "25px" }}
            >
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
            <Message sx={{ fontSize: "25px" }} />
            <Help sx={{ fontSize: "25px" }} />
            <FormControl variant="standard" value={fullName}>
              <Select
                value={fullName}
                sx={{
                  backgroundColor: neutralLight,
                  width: "150px",
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                  "& .MuiSvgIcon-root": {
                    pr: "0.25rem",
                    width: "3rem",
                  },
                  "& .MuiSelect-select:focus": {
                    backgroundColor: neutralLight,
                  },
                }}
                input={<InputBase />}
              >
                <MenuItem value={fullName}>
                  <Typography>{fullName}</Typography>
                </MenuItem>
                <MenuItem onClick={() => dispatch(setLogout())}>
                  Log Out
                </MenuItem>
              </Select>
            </FormControl>
          </FlexBetween>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;
