import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* search */
export const searchUsers = async (req, res) => {
  try {
    const { search } = req.params; // Get the search query from query parameters

    const query = search.trim();

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Find users matching the search query (e.g., by name or username)
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } }, // Case-insensitive match for first name
      ],
    }).limit(10); // Optional: Limit results to avoid too many matches

    const formattedUsers = users.map(({ _id, firstName }) => {
      return { _id, firstName };
    });

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};
