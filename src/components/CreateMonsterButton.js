import React, { useRef, useState, useEffect } from 'react';

import { CONTRACT_ADDRESS, fetchAccount, TxStatus } from '../StacksAccount';
import { useConnect } from '@blockstack/connect';
import { PostConditionMode, bufferCVFromString } from '@blockstack/stacks-transactions';

export function CreateMonsterButton({ ownerStxAddress }) {
  const { doContractCall } = useConnect();
  const textfield = useRef();
  const spinner = useRef();
  const [status, setStatus] = useState();
  const [txId, setTxId] = useState();

  useEffect(() => {
    fetchAccount(ownerStxAddress)
      .catch(e => {
        setStatus('Failed to access your account', e);
        console.log(e);
      })
      .then(async acc => {
        console.log({ acc });
      });
  }, [ownerStxAddress]);

  const sendAction = async () => {
    spinner.current.classList.remove('d-none');

    var name = textfield.current.value.trim();

    try {
      setStatus(`Sending transaction`);

      await doContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'monsters',
        functionName: 'create-monster',
        functionArgs: [bufferCVFromString(name)],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        appDetails: {
          name: 'Speed Spend',
          icon: 'https://speed-spend.netlify.app/speedspend.png',
        },
        finished: data => {
          console.log(data);
          setTxId(data.txId);
          spinner.current.classList.add('d-none');
        },
      });
    } catch (e) {
      console.log(e);
      setStatus(e.toString());
      spinner.current.classList.add('d-none');
    }
  };

  return (
    <div>
      <h5>Create your own monster</h5>
      <div className="NoteField input-group ">
        <input
          type="text"
          ref={textfield}
          className="form-control"
          defaultValue={''}
          placeholder="Name of monster (20 letters max)"
          onKeyUp={e => {
            if (e.key === 'Enter') sendAction();
          }}
          onBlur={e => {
            setStatus(undefined);
          }}
        />
        <div className="input-group-append">
          <button className="btn btn-outline-secondary" type="button" onClick={sendAction}>
            <div
              ref={spinner}
              role="status"
              className="d-none spinner-border spinner-border-sm text-info align-text-top mr-2"
            />
            Create
          </button>
        </div>
      </div>
      <div>
        <TxStatus txId={txId} resultPrefix="Birth happened in block " />
      </div>
      {status && (
        <>
          <div>{status}</div>
        </>
      )}
    </div>
  );
}