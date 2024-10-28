import { Typography } from '@material-tailwind/react';
import {
  ClarityType,
  cvToString,
  getContractMapEntry,
  OptionalCV,
  TupleCV,
  UIntCV,
  uintCV,
  noneCV,
  hexToCV,
} from '@stacks/transactions';
import React, { useEffect, useState } from 'react';
import { MonsterCard } from './MonsterCard';
import { CONTRACT_ADDRESS, infoApi, MONSTERS_CONTRACT_NAME, NETWORK } from '../lib/constants';
import { fetchMonsterDetails, fetchMonsterIds, MonsterDetails } from '../lib/monster';
import { showContractCall } from '@stacks/connect';
import { AnchorMode, PostConditionMode } from '@stacks/transactions';
import { TxStatus } from './TxStatus';

// Define the types for better TypeScript support
interface CompetitionData {
  monsters: MonsterDetails[];
  secondBestPrize?: MonsterDetails;
}

export function MyMonsters({ stxAddress }: { stxAddress: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [monsters, setMonsters] = useState<MonsterDetails[]>([]);
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const [txId, setTxId] = useState<string>('');

  // Fetch the user's monster IDs and details
  useEffect(() => {
    const fn = async () => {
      if (stxAddress) {
        setLoading(true);
        try {
          const monsterIds = await fetchMonsterIds(stxAddress);
          console.log('Fetched Monster IDs:', monsterIds);
          if (monsterIds.length === 0) {
            setStatus('No monsters found for this user.');
            return;
          }

          try {
            const monstersDetails = await Promise.all(
              monsterIds.map(id => {
                const idCV = hexToCV(id) as UIntCV;
                return fetchMonsterDetails(idCV.value);
              })
            );
            console.log('Fetched Monster Details:', monstersDetails);
            setMonsters(monstersDetails);
          } catch (detailsError) {
            console.error('Error fetching monster details:', detailsError);
            setStatus('Failed to fetch monster details.');
          }
        } catch (fetchError: any) {
          console.error('Error fetching monster IDs:', fetchError);
          setStatus(`Failed to fetch monsters for ${stxAddress}`);
        } finally {
          setLoading(false);
        }
      }
    };
    fn();
  }, [stxAddress]);

  // Fetch competition data
  useEffect(() => {
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
        return { monsters: [] };
      }
    };

    getCompetitionData().then(data => {
      setCompetitionData(data);
    });
  }, []);

  // Function to call the smart contract to use a tool
  const useTool = async (monsterId: string) => {
    setTxId('');
    const parsedId = parseInt(monsterId, 10);
    if (isNaN(parsedId)) {
      setStatus('Invalid Monster ID.');
      return;
    }

    try {
      setStatus('Sending transaction...');
      await showContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: MONSTERS_CONTRACT_NAME,
        functionName: 'use',
        functionArgs: [uintCV(parsedId), noneCV()],
        network: NETWORK,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        onFinish: result => {
          setTxId(result.txId);
          setStatus(`Joining competition.`);
        },
      });
    } catch (e: any) {
      console.error(e);
      setStatus(`Transaction failed: ${e.message}`);
    }
  };

  return (
    <div className="p-4">

      {/* Display User's Monsters */}
      {loading ? (
        <div className="mb-4">{<Typography>Loading...</Typography>}</div>
      ) : (
        <div className="my-monsters-grid grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
          {monsters.length > 0 ? (
            monsters.map((monster, index) => (
              <MonsterCard
                monster={monster}
                key={index}
                currentUser={stxAddress}
                actionLabel={monster.alive ? 'Join competition' : undefined}
                onClick={() => useTool(monster.metaData.id.toString())}
              />
            ))
          ) : (
            <Typography>No monsters found. Create one. It is fast...</Typography>
          )}
        </div>
      )}
      {status && <Typography>{status}</Typography>}
      {txId && <TxStatus txId={txId} resultPrefix="Tx result:" />}

      {/* Display Competition Data */}
      <div className="bg-white p-4 rounded shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-2">Competition</h2>
        <div className="text-center mb-6">
          <Typography>
            The competition takes one tenure (usually 1 bitcoin block). The monster that used the
            most tools (calling "use" contract function) wins the competition. The prize is the second-best monster.
          </Typography>
        </div>
        <h2 className="text-xl font-semibold mb-2">Prize</h2>
        {competitionData?.secondBestPrize ? (
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
    </div>
  );
}
