import { decrypSecret } from "@/util/crypto";
import { PrismaClient } from "@prisma/client";
import { SecretManager, SecretMap } from "../types";



export class ChainCastSecretManager implements  SecretManager{
    
    private _db: PrismaClient;

    _secrets: SecretMap = {}


    constructor( db: PrismaClient) {
        this._db = db;
    }

    async load() {
        const dbSecrets = await this._db.secret.findMany({
            select: {
                name: true,
                salt: true,
                value: true,
            }
        });
        dbSecrets.forEach((dbSecret)=> {
            const initVector = Buffer.from(dbSecret.salt, 'base64');
            const secret = decrypSecret(dbSecret.value, initVector, 'base64', 'utf-8');
            this._secrets[dbSecret.name] = secret;
        })
    }

    addSecret(name: string, value: string) {
        this._secrets[name] = value;
    }

    deleteSecret(name: string) {
        delete this._secrets[name] 
    }

    updateSecret(name: string, value: string) {
        this._secrets[name] = value;
    }

    getSecret(name: string) {
        return this._secrets[name];
    }

    getSecrets() {
        return this._secrets;
    }
}