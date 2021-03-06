import { ServerResponse } from "http";

import { hash } from "./hash";
import bodyParser from "body-parser";

const jsonParse = bodyParser.json();
const getBodyAsJson = (req, res) => {
  return new Promise((resolve, reject) => {
    try {
      jsonParse(req, res, () => {
        resolve(req.body);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export type BraidResponse = {
  startSubscription: Function;
  sendVersion: Function;
};

export type ServerResponsePlusBraid = ServerResponse & BraidResponse;

export type GetUrl<T> = (item: T) => string;

export class Resource<T> {
  version: number;
  value: T;
  subscriptions: Record<string, ServerResponsePlusBraid>;
  getUrl: GetUrl<T>;

  constructor(getUrl: GetUrl<T>, initialValue: T) {
    this.version = 0;
    this.value = initialValue;
    this.subscriptions = {};
    this.getUrl = getUrl;
  }

  get url() {
    return this.getUrl(this.value);
  }

  change() {
    // A change means the store holds a new version
    this.version++;

    for (const response of Object.values(this.subscriptions)) {
      this.sendValue(response, this.version, this.value);
    }
  }

  addSubscription(subId: string, response: ServerResponsePlusBraid) {
    response.startSubscription({
      onClose: () => delete this.subscriptions[subId],
    });
    this.subscriptions[subId] = response;
  }

  sendValue(response: ServerResponsePlusBraid, version: number, value: T) {
    console.log("sendValue", JSON.stringify(value));
    response.sendVersion({
      version,
      body: JSON.stringify(value),
    });
  }

  // If the request is a regular GET, treat it as a one-time response.
  // If the request is a Subscribe-GET, add to subscriptions pool
  subscribe(req, response: ServerResponsePlusBraid) {
    response.setHeader("content-type", "application/json");

    if (req.subscribe) {
      const subscriptionId = hash(req.headers.client, req.url);

      // Continue to send updated values
      this.addSubscription(subscriptionId, response);

      // Send initial value
      this.sendValue(response, this.version, this.value);
    } else {
      response.statusCode = 200;
      response.end(JSON.stringify(this.value));
    }
  }

  async patch(req, response: ServerResponsePlusBraid) {
    if (req.headers["patches"]) {
      const error = `Resource#patch not yet supported`;
      console.warn(error);
      // var patches = await req.patches();
      // TODO: support braid patches
      response.statusCode = 400;
      response.end(
        JSON.stringify({
          error,
        })
      );
    } else {
      const json: T = (await getBodyAsJson(req, response)) as T;
      this.value = Object.assign(json, { index: (this.value as any).index });
      this.change();

      response.statusCode = 200;
      response.end();
    }
  }
}
