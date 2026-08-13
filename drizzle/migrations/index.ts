const migration0000 = `
CREATE TABLE \`cards\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`alias\` text NOT NULL,
	\`bank\` text,
	\`brand\` text,
	\`last_four\` text,
	\`closing_day\` integer,
	\`color\` text,
	\`created_at\` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`categories\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`icon\` text,
	\`color\` text
);
--> statement-breakpoint
CREATE TABLE \`currencies\` (
	\`code\` text PRIMARY KEY NOT NULL,
	\`symbol\` text NOT NULL,
	\`name\` text NOT NULL,
	\`minor_unit\` integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`extra_purchases\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`subscription_id\` integer NOT NULL,
	\`description\` text NOT NULL,
	\`amount_minor\` integer NOT NULL,
	\`currency_code\` text NOT NULL,
	\`purchased_at\` integer NOT NULL,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`subscription_id\`) REFERENCES \`subscriptions\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`currency_code\`) REFERENCES \`currencies\`(\`code\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`monthly_snapshots\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`month_year\` text NOT NULL,
	\`total_monthly_minor\` integer NOT NULL,
	\`currency_code\` text NOT NULL,
	\`subscription_count\` integer NOT NULL,
	\`snapshot_data\` text,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`currency_code\`) REFERENCES \`currencies\`(\`code\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`plans\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`provider_id\` integer NOT NULL,
	\`name\` text NOT NULL,
	\`frequency\` text NOT NULL,
	\`suggested_price_minor\` integer NOT NULL,
	\`currency_code\` text NOT NULL,
	\`credits_included\` integer,
	\`is_suggested\` integer DEFAULT true NOT NULL,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`currency_code\`) REFERENCES \`currencies\`(\`code\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`providers\` (
	\`id\` integer,
	\`name\` text NOT NULL,
	\`logo_url\` text,
	\`website_url\` text,
	\`is_custom\` integer DEFAULT false NOT NULL,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`settings\` (
	\`key\` text PRIMARY KEY NOT NULL,
	\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`subscriptions\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`provider_id\` integer,
	\`custom_name\` text,
	\`plan_id\` integer,
	\`custom_plan_name\` text,
	\`confirmed_price_minor\` integer NOT NULL,
	\`currency_code\` text NOT NULL,
	\`converted_price_minor\` integer,
	\`converted_currency_code\` text,
	\`exchange_rate\` integer,
	\`exchange_rate_date\` integer,
	\`exchange_rate_source\` text,
	\`frequency\` text NOT NULL,
	\`next_renewal_date\` integer,
	\`start_date\` integer,
	\`category_id\` integer,
	\`card_id\` integer,
	\`credits_included\` integer,
	\`data_origin\` text DEFAULT 'manual' NOT NULL,
	\`is_active\` integer DEFAULT true NOT NULL,
	\`notes\` text,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	\`updated_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`plan_id\`) REFERENCES \`plans\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`currency_code\`) REFERENCES \`currencies\`(\`code\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`converted_currency_code\`) REFERENCES \`currencies\`(\`code\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`card_id\`) REFERENCES \`cards\`(\`id\`) ON UPDATE no action ON DELETE no action
);
`;

const migration0001 = `PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE \`__new_providers\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`logo_url\` text,
	\`website_url\` text,
	\`category_id\` integer,
	\`is_custom\` integer DEFAULT false NOT NULL,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO \`__new_providers\`("id", "name", "logo_url", "website_url", "category_id", "is_custom", "created_at") SELECT "id", "name", "logo_url", "website_url", "category_id", "is_custom", "created_at" FROM \`providers\`;
--> statement-breakpoint
DROP TABLE \`providers\`;
--> statement-breakpoint
ALTER TABLE \`__new_providers\` RENAME TO \`providers\`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;`;

const migration0002 = `ALTER TABLE \`providers\` ADD COLUMN \`pricing_url\` text;
--> statement-breakpoint
CREATE TABLE \`price_watch_logs\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`provider_id\` integer,
	\`provider_name\` text NOT NULL,
	\`plan_name\` text,
	\`old_price_minor\` integer,
	\`new_price_minor\` integer NOT NULL,
	\`currency_code\` text NOT NULL,
	\`frequency\` text,
	\`detected_at\` integer NOT NULL,
	\`is_read\` integer DEFAULT false NOT NULL,
	\`created_at\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`provider_id\`) REFERENCES \`providers\`(\`id\`) ON UPDATE no action ON DELETE no action
);`;

export default {
  journal: {
    version: '7',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '6',
        when: 1785961739254,
        tag: '0000_giant_toad',
        breakpoints: true,
      },
      {
        idx: 1,
        version: '6',
        when: 1785961800000,
        tag: '0001_slow_shinko_yamashiro',
        breakpoints: true,
      },
      {
        idx: 2,
        version: '6',
        when: 1785961900000,
        tag: '0002_price_watch',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    m0000: migration0000,
    m0001: migration0001,
    m0002: migration0002,
  },
};
