export const login = async (formData) => {
  const response = await fetch(
    `${import.meta.env.VITE_SERVER_DOMAIN}/users/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Login failed");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  if (!data.token) {
    throw new Error("No token received from server");
  }

  localStorage.setItem("token", data.token);
  return data.token;
};

export const googleLogin = async (idToken) => {
  const response = await fetch(
    `${import.meta.env.VITE_SERVER_DOMAIN}/users/google-login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Google login failed");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Google login failed");
  }

  if (!data.token) {
    throw new Error("No token received from server");
  }

  localStorage.setItem("token", data.token);
  return data.token;
};

export const register = async (formData) => {
  const response = await fetch(
    `${import.meta.env.VITE_SERVER_DOMAIN}/users/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }
  );

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Registration failed");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Registration failed");
  }

  if (!data.token) {
    throw new Error("No token received from server");
  }

  localStorage.setItem("token", data.token);
  return data.token;
};
