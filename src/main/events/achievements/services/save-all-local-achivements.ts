import {
  steamGameAchievementsRepository,
  steamGameRepository,
} from "@main/repository";
import { steamFindGameAchievementFiles } from "../steam/steam-find-game-achivement-files";
import { steamGlobalAchievementPercentages } from "../steam/steam-global-achievement-percentages";
import { steamAchievementInfo } from "../steam/steam-achievement-info";
import { steamAchievementMerge } from "../steam/steam-achievement-merge";
import { parseAchievementFile } from "../util/parseAchievementFile";
import { checkUnlockedAchievements } from "../util/check-unlocked-achievements";
import { CheckedAchievements } from "../types";

export const saveAllLocalAchivements = async () => {
  const gameAchievementFiles = steamFindGameAchievementFiles();

  for (const key of Object.keys(gameAchievementFiles)) {
    const id = Number(key);

    if (isNaN(id)) continue;

    const steamGame = await steamGameRepository.findOne({
      where: { id },
    });

    if (!steamGame) continue;

    const hasOnDb = await steamGameAchievementsRepository.existsBy({
      steamGame,
    });

    if (hasOnDb) continue;

    const achievementPercentage = await steamGlobalAchievementPercentages(id);

    if (!achievementPercentage) {
      await steamGameAchievementsRepository.save({
        steamGame,
        achievements: "[]",
      });
      continue;
    }

    const achievementInfo = await steamAchievementInfo(id);

    if (!achievementInfo) continue;

    const achievements = steamAchievementMerge(
      achievementPercentage,
      achievementInfo
    );

    if (!achievements) continue;

    const checkedAchievements: CheckedAchievements = {
      all: achievements,
      new: [],
    };

    for (const achievementFile of gameAchievementFiles[key]) {
      const localAchievementFile = await parseAchievementFile(
        achievementFile.filePath
      );

      checkedAchievements.new.push(
        ...checkUnlockedAchievements(
          achievementFile.type,
          localAchievementFile,
          achievements
        ).new
      );
    }

    await steamGameAchievementsRepository.save({
      steamGame,
      achievements: JSON.stringify(checkedAchievements.all),
    });
  }
};
