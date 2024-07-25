import createNewMockTest from "./createNewMockTest.js";
import generateMockTest from "./generateMockTest.js";

export default async ({ req, res, log, error }) => {
  const body = req.body;
  const { action, userId, userName, tradeName, tradeId, year, quesCount } =
    JSON.parse(body);

  log(body);

  let result = {};

  switch (action) {
    case "generateMockTest":
      result = await generateMockTest({
        userId,
        userName,
        tradeName,
        tradeId,
        year,
        quesCount,
        error,
      });
      break;

    case "createNewMockTest":
      result = await createNewMockTest({ paperId, userId, userName, error });

    default:
      result = { error: "Invalid action" };
      break;
  }
  return res.send(result);
};
