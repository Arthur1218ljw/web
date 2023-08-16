import { writeFileSync } from 'fs'
import { AuctionProject } from '../src/contracts/auctionProject'
import { privateKey } from './privateKey'
import { bsv, TestWallet, DefaultProvider, sha256 } from 'scrypt-ts'

function getScriptHash(scriptPubKeyHex: string) {
    const res = sha256(scriptPubKeyHex).match(/.{2}/g)
    if (!res) {
        throw new Error('scriptPubKeyHex is not of even length')
    }
    return res.reverse().join('')
}

async function main() {
    //TXID: b3c3bb3de3f5996d9f8aef7b456dd516c87dfab78d57f45513b76cffaa45398f
    //scriptHash: 59e0f34a6042605559f693a1e1e8759f2fd860a4d1efc8085f362c73136c9d6d
    await AuctionProject.compile()

    // Prepare signer. 
    // See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
    const signer = new TestWallet(privateKey, new DefaultProvider({
        network: bsv.Networks.testnet
    }))

    // TODO: Adjust the amount of satoshis locked in the smart contract:
    const amount = 100

    const instance = new AuctionProject(
        // TODO: Pass constructor parameter values.
        0n
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)

    // Save deployed contracts script hash.
    const scriptHash = getScriptHash(instance.lockingScript.toHex())
    const shFile = `.scriptHash`;
    writeFileSync(shFile, scriptHash);

    console.log('AuctionProject contract was successfully deployed!')
    console.log(`TXID: ${deployTx.id}`)
    console.log(`scriptHash: ${scriptHash}`)
}

main()
