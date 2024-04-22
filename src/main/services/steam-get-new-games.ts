import axios from "axios";
import { steamGameRepository } from "@main/repository";
import { logger } from "./logger";

interface SteamAppsResponse {
  applist: { apps: Array<{ appid: number; name: string }> };
}

const sleep = async (time: number) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
};

const steamGameInformation = async (gameId: number) => {
  return await axios
    .get(`http://store.steampowered.com/api/appdetails?appids=${gameId}`, {
      method: "GET",
    })
    .then((res) => {
      return res.data;
    });
};

const minutesToMilliseconds = (minutes: number) => {
  const milliseconds = 1000;
  const seconds = 60;
  return minutes * seconds * milliseconds;
};

export const steamGetNewGames = async () => {
  const lastGameId = (
    await steamGameRepository
      .createQueryBuilder()
      .orderBy("id", "DESC")
      .limit(1)
      .execute()
  )?.[0]?.SteamGame_id;

  if (!lastGameId) return;

  const steamGames: Array<{ appid: number; name: string }> | null = await axios
    .get(
      "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json"
    )
    .then((res) => {
      if (res.status === 200) return res.data;
      return null;
    })
    .then((data: SteamAppsResponse) => {
      if (!data) return data;
      return data.applist.apps
        .filter((v) => v.appid > lastGameId)
        .sort((a, b) => a.appid - b.appid);
    })
    .catch((err) => {
      logger.error(err, { method: "steamGetNewGames" });
      return null;
    });

  if (!steamGames) return;

  const fetchSize = 20;
  const sleepTime = minutesToMilliseconds(3);

  let fetchArr = [];

  try {
    for (let i = 0; i < steamGames.length; i += fetchSize) {
      for (
        let j = i;
        j < steamGames.length && fetchArr.length < fetchSize;
        j++
      ) {
        fetchArr.push(steamGameInformation(steamGames[j].appid));
      }

      const games: Array<{
        id: number | null;
        name: string | null;
      }> = (await Promise.all(fetchArr))
        .map((result: any) => {
          const data = result[Object.keys(result)[0]]?.data;
          const type: string = data?.type;
          if (type === "game") {
            return { id: data.steam_appid, name: data.name };
          } else {
            return { id: null, name: null };
          }
        })
        .filter((game) => game.id);

      fetchArr = [];

      await steamGameRepository.insert(games);

      await sleep(sleepTime);
    }
  } catch (err) {
    logger.error(err, { method: "steamGetNewGames" });
  }
};
