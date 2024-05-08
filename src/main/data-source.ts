import { DataSource } from "typeorm";
import {
  Game,
  GameShopCache,
  Repack,
  RepackerFriendlyName,
  UserPreferences,
  MigrationScript,
  SteamGame,
  SteamGameAchievements,
} from "@main/entity";
import type { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";

import { databasePath } from "./constants";

export const createDataSource = (options: Partial<SqliteConnectionOptions>) =>
  new DataSource({
    type: "better-sqlite3",
    database: databasePath,
    entities: [
      Game,
      Repack,
      RepackerFriendlyName,
      UserPreferences,
      GameShopCache,
      MigrationScript,
      SteamGame,
      SteamGameAchievements,
    ],
    ...options,
  });

export const dataSource = createDataSource({
  synchronize: true,
});
