import { Query } from "appwrite";

export const generateBinaryHash = (descriptor) =>
  descriptor
    .map((val) => (val > 0 ? "1" : "0"))
    .join("")
    .substring(0, 128);

export const generateHashArrayForMatch = (hash) => {
  return (hash.match(/.{1,20}/g) || []).slice(0, 4); //For match face Best setting
};

export const generateHashArrayForAdd = (hash) => {
  return (hash.match(/.{1,30}/g) || []).slice(0, 3); //For adding face best setting
};

export const generateHashQuery = (hashArray) =>
  Query.or(hashArray.map((hash) => Query.contains("hash", hash)));
