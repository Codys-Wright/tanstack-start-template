alter table "user" add column "twoFactorEnabled" boolean;

alter table "session" add column "activeOrganizationId" text;

alter table "session" add column "activeTeamId" text;

create table "organization" ("id" text not null primary key, "name" text not null, "slug" text not null unique, "logo" text, "createdAt" timestamptz not null, "metadata" text);

create table "team" ("id" text not null primary key, "name" text not null, "organizationId" text not null references "organization" ("id") on delete cascade, "createdAt" timestamptz not null, "updatedAt" timestamptz);

create table "teamMember" ("id" text not null primary key, "teamId" text not null references "team" ("id") on delete cascade, "userId" text not null references "user" ("id") on delete cascade, "createdAt" timestamptz);

create table "member" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "userId" text not null references "user" ("id") on delete cascade, "role" text not null, "createdAt" timestamptz not null);

create table "invitation" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "email" text not null, "role" text, "teamId" text, "status" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "inviterId" text not null references "user" ("id") on delete cascade);

create table "twoFactor" ("id" text not null primary key, "secret" text not null, "backupCodes" text not null, "userId" text not null references "user" ("id") on delete cascade);

create table "passkey" ("id" text not null primary key, "name" text, "publicKey" text not null, "userId" text not null references "user" ("id") on delete cascade, "credentialID" text not null, "counter" integer not null, "deviceType" text not null, "backedUp" boolean not null, "transports" text, "createdAt" timestamptz, "aaguid" text);

create unique index "organization_slug_uidx" on "organization" ("slug");

create index "team_organizationId_idx" on "team" ("organizationId");

create index "teamMember_teamId_idx" on "teamMember" ("teamId");

create index "teamMember_userId_idx" on "teamMember" ("userId");

create index "member_organizationId_idx" on "member" ("organizationId");

create index "member_userId_idx" on "member" ("userId");

create index "invitation_organizationId_idx" on "invitation" ("organizationId");

create index "invitation_email_idx" on "invitation" ("email");

create index "twoFactor_secret_idx" on "twoFactor" ("secret");

create index "twoFactor_userId_idx" on "twoFactor" ("userId");

create index "passkey_userId_idx" on "passkey" ("userId");

create index "passkey_credentialID_idx" on "passkey" ("credentialID");