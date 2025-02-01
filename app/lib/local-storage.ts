const cacheGet = (key: string) => {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
};

const cacheSet = (key: string, value: string) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const cacheDelete = (key: string) => {
  localStorage.removeItem(key);
};

const cacheKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
};

export { cacheGet, cacheSet, cacheDelete, cacheKeys };