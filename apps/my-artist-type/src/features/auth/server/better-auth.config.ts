import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";

export type BetterAuthConfigValues = {
  readonly BETTER_AUTH_URL: string;
  readonly BETTER_AUTH_SECRET: Redacted.Redacted<string>;
  readonly DATABASE_URL: Redacted.Redacted<string>;
  readonly CLIENT_ORIGIN: string;
  readonly GOOGLE_CLIENT_ID: Option.Option<Redacted.Redacted<string>>;
  readonly GOOGLE_CLIENT_SECRET: Option.Option<Redacted.Redacted<string>>;
  readonly APP_NAME: string;
};

const betterAuthConfig: Config.Config<BetterAuthConfigValues> = Config.all({
  BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
  DATABASE_URL: Config.redacted("DATABASE_URL"),
  CLIENT_ORIGIN: Config.option(Config.string("CLIENT_ORIGIN")).pipe(
    Config.map(Option.getOrElse(() => "http://localhost:5173")),
  ),
  GOOGLE_CLIENT_ID: Config.option(Config.redacted("GOOGLE_CLIENT_ID")),
  GOOGLE_CLIENT_SECRET: Config.option(Config.redacted("GOOGLE_CLIENT_SECRET")),
  APP_NAME: Config.withDefault(Config.string("APP_NAME"), "TanStack App"),
});

export class BetterAuthConfig extends Effect.Service<BetterAuthConfig>()(
  "BetterAuthConfig",
  {
    effect: betterAuthConfig,
    dependencies: [Layer.setConfigProvider(ConfigProvider.fromEnv())],
  },
) {}

export const getDatabaseUrl = (env: BetterAuthConfigValues) =>
  Redacted.value(env.DATABASE_URL);
export const getAuthSecret = (env: BetterAuthConfigValues) =>
  Redacted.value(env.BETTER_AUTH_SECRET);
