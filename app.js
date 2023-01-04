const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeBDAndserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error:${e.mesaage}`);
    process.exit(1);
  }
};
initializeBDAndserver();

//API 1
const getStatesList = (list) => {
  return {
    stateId: list.state_id,
    stateName: list.state_name,
    population: list.population,
  };
};
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state`;
  const getAllStates = await db.all(getAllStatesQuery);
  response.send(getAllStates.map((list) => getStatesList(list)));
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const getState = await db.get(getStateQuery);
  response.send(getStatesList(getState));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
      );`;

  const dbResponse = await db.run(addDistrictQuery);
  response.send(`District Successfully Added`);
});

//API 4
const getDistrictList = (list) => {
  return {
    districtId: list.district_id,
    districtName: list.district_name,
    stateId: list.state_id,
    cases: list.cases,
    cured: list.cured,
    active: list.active,
    deaths: list.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const getDistrictObj = await db.get(getDistrictQuery);
  response.send(getDistrictList(getDistrictObj));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId}`;
  const deleteDistrict = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;
  const updateDistrictQuery = `UPDATE district SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send(`District Details Updated`);
});

//API 7
const getAllStatesList = (list) => list;

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalStatsQuery = `
   SELECT 
   sum(cases),
   sum(cured),
   sum(active),
   sum(deaths)
   FROM 
   district 
   WHERE state_id = ${stateId}`;
  const getAllStatsObj = await db.all(getTotalStatsQuery);
  //   console.log(getAllStatsObj);
  response.send({
    totalCases: getAllStatsObj[0]["sum(cases)"],
    totalCured: getAllStatsObj[0]["sum(cured)"],
    totalActive: getAllStatsObj[0]["sum(active)"],
    totalDeaths: getAllStatsObj[0]["sum(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
  SELECT
   *
 FROM 
 district INNER JOIN state on district.state_id = state.state_id
 WHERE 
 district_id = ${districtId}`;

  const getStateNameObj = await db.get(getStateNameQuery);
  response.send({
    stateName: getStateNameObj["state_name"],
  });
});
module.exports = app;
