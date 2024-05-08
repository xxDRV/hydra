import path from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { Cracker, GameAchievementFiles } from "../types";
import { app } from "electron";

const addGame = (
  achievementFiles: GameAchievementFiles,
  gamePath: string,
  gameId: string,
  fileLocation: string[],
  type: Cracker
) => {
  const filePath = path.join(gamePath, gameId, ...fileLocation);

  if (existsSync(filePath)) {
    const achivementFile = {
      type,
      filePath: filePath,
    };

    achievementFiles[gameId]
      ? achievementFiles[gameId].push(achivementFile)
      : (achievementFiles[gameId] = [achivementFile]);
  }
};

export const steamFindGameAchievementFiles = (
  steamGameId: number = 0
): GameAchievementFiles => {
  //TODO: change to a automatized method
  const publicDir = path.join("C:", "Users", "Public", "Documents");
  const appData = app.getPath("appData");

  const gameAchievementFiles: GameAchievementFiles = {};

  const crackers: Cracker[] = [
    Cracker.codex,
    Cracker.goldberg,
    Cracker.rune,
    Cracker.onlineFix,
  ];

  for (const cracker of crackers) {
    let achievementPath: string;
    let fileLocation: string[];

    if (cracker === Cracker.onlineFix) {
      achievementPath = path.join(publicDir, Cracker.onlineFix);
      fileLocation = ["Stats", "Achievements.ini"];
    } else if (cracker === Cracker.goldberg) {
      achievementPath = path.join(appData, "Goldberg SteamEmu Saves");
      fileLocation = ["achievements.json"];
    } else {
      achievementPath = path.join(publicDir, "Steam", cracker);
      fileLocation = ["achievements.ini"];
    }

    if (!existsSync(achievementPath)) continue;

    const gamesId = readdirSync(achievementPath);

    if (steamGameId) {
      if (gamesId.includes(String(steamGameId))) {
        addGame(
          gameAchievementFiles,
          achievementPath,
          String(steamGameId),
          fileLocation,
          cracker
        );
      }
    } else {
      for (const gameId of gamesId) {
        addGame(
          gameAchievementFiles,
          achievementPath,
          gameId,
          fileLocation,
          cracker
        );
      }
    }
  }

  return gameAchievementFiles;
};
