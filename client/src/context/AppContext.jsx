import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Create axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
  });

  // ✅ Attach token to every request
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ✅ Global 401 handler
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        navigate("/login");
      }
      return Promise.reject(error);
    }
  );

  // ✅ Fetch logged-in user data
  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/user/data");
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch user data");
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ Fetch user's chats
  const fetchUsersChats = async () => {
    try {
      const { data } = await api.get("/api/chat/get");
      if (data.success) {
        // ✅ Always sort chats so latest chat comes first
        const sortedChats = [...data.chats].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        setChats(sortedChats);

        // ✅ Select first chat if none is selected
        if (!selectedChat && sortedChats.length > 0) {
          setSelectedChat(sortedChats[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch chats");
    }
  };

  // ✅ Create a new chat and put it at the top
  const createNewChat = async () => {
    try {
      if (!user) return toast("Login to create a new chat");

      // ✅ Create the chat
      const { data } = await api.get("/api/chat/create");

      if (data.success) {
        // ✅ Fetch updated chats list
        const chatsResponse = await api.get("/api/chat/get");

        if (chatsResponse.data.success) {
          // ✅ Get all chats and sort by latest first
          const updatedChats = [...chatsResponse.data.chats].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );

          setChats(updatedChats);

          // ✅ New chat will always be at index 0 after sorting
          const newChat = updatedChats[0];
          setSelectedChat(newChat);

          // ✅ Navigate to home
          navigate("/");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create chat");
    }
  };

  // ✅ Theme management
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ✅ Fetch chats when user changes
  useEffect(() => {
    if (user) {
      fetchUsersChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  // ✅ Fetch user data when token changes
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, [token]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUsersChats,
    token,
    setToken,
    axios: api,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

