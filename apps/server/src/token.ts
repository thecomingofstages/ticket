import { sealData, unsealData } from "iron-session";

type TokenData = {
  uid: string;
};

export const createToken = (token: TokenData, password: string) => {
  return sealData(token, {
    password,
    ttl: 2 * 60,
  });
};

export const parseToken = (token: string, password: string) => {
  return unsealData<TokenData>(token, {
    password,
    ttl: 2 * 60,
  });
};
