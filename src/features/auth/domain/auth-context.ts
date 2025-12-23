import * as Context from "effect/Context";

export class AuthContext extends Context.Tag("AuthContext")<
  AuthContext,
  { readonly user_id: string }
>() {}
