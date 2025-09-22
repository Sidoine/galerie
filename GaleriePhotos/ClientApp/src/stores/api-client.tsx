import { SimpleApiClient, UserStore } from "folke-service-helpers";
import { createContext, useContext } from "react";

class MyApiClient extends SimpleApiClient {
  constructor() {
    super(null, undefined);
  }

  override fetch(url: string, method: string, data: any) {
    if (!url.startsWith("/")) url = `/${url}`;
    return super.fetch(`http://localhost:6009${url}`, method, data);
  }
}

const MyApiClientContext = createContext<MyApiClient>(new MyApiClient());

export function useMyApiClient() {
  return useContext(MyApiClientContext);
}
