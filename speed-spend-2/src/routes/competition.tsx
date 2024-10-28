import { Typography } from '@material-tailwind/react';
import {
  ClarityType,
  cvToString,
  getContractMapEntry,
  OptionalCV,
  TupleCV,
  UIntCV,
  uintCV,
} from '@stacks/transactions';
import React, { useEffect, useState } from 'react';
import { MonsterCard } from '../components/MonsterCard';
import { CONTRACT_ADDRESS, infoApi, MONSTERS_CONTRACT_NAME, NETWORK } from '../lib/constants';
import { fetchMonsterDetails, MonsterDetails } from '../lib/monster';
// Define the types for better TypeScript support

interface CompetitionData {
  monsters: MonsterDetails[];
  secondBestPrize?: MonsterDetails;
}

// Replace with your actual API endpoint or function to fetch competition data.
const getCompetitionData = async (): Promise<CompetitionData> => {
  try {
    const { tenure_height: tenureHeight } = await infoApi
      .getCoreApiInfoRaw()
      .then(r => r.raw.json());
    console.log({ tenureHeight });
    const entry = (await getContractMapEntry({
      contractAddress: CONTRACT_ADDRESS,
      contractName: MONSTERS_CONTRACT_NAME,
      mapName: 'second-bests',
      mapKey: uintCV(tenureHeight),
      network: NETWORK,
    })) as OptionalCV<TupleCV<{ 'monster-id': UIntCV; count: UIntCV }>>;
    console.log({ entry: cvToString(entry) });
    if (entry.type === ClarityType.OptionalSome && entry.value.data['monster-id'].value > 0n) {
      const prize = await fetchMonsterDetails(entry.value.data['monster-id'].value);
      return { monsters: [], secondBestPrize: prize };
    } else {
      return { monsters: [], secondBestPrize: undefined };
    }
  } catch (error) {
    console.error('Error fetching competition data:', error);
    return {
      monsters: [],
    };
  }
};

const Competition: React.FC = () => {
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch competition data when the component mounts
    getCompetitionData().then(data => {
      setCompetitionData(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading competition data...</p>;

  if (!competitionData) {
    return <p>No competition data available.</p>;
  }

  const { monsters } = competitionData;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center">Monster Competition</h1>

      <div className="text-center mb-6">
        <Typography>
          The competition takes one tenure (usually 1 bitcoin block). The monster that used the most
          tools (calling "use" contract function) wins the competition. The prize is the second best
          monster.
        </Typography>
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Prize</h2>
        {competitionData.secondBestPrize ? (
          <MonsterCard
            monster={competitionData.secondBestPrize}
            onClick={() => {
              return;
            }}
          />
        ) : (
          <Typography>No prize available.</Typography>
        )}
      </div>

      {false && (
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Current Monsters in Competition</h2>
          {monsters.length === 0 ? (
            <p className="text-gray-500">No monsters are currently in the competition.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monsters.map((monster, index) => (
                <div
                  key={index}
                  className="card bg-gray-50 p-4 rounded shadow transform transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
                >
                  <h3 className="text-lg font-bold">{monster.metaData.name}</h3>
                  <p className="text-gray-600">Owner: {monster.owner}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Competition;
