import React from "react";

import { render } from "@testing-library/react-native";

import useRefetchOnReconnect from "./useRefetchOnReconnect";

const mockNetwork = jest.fn();
jest.mock("@common", () => ({
  useNetwork: () => mockNetwork(),
}));

const Probe = ({ isStale, retry }) => {
  useRefetchOnReconnect(isStale, retry);
  return null;
};

const online = { isOnline: true };
const offline = { isOnline: false };

describe("useRefetchOnReconnect", () => {
  let retry;

  beforeEach(() => {
    retry = jest.fn();
    mockNetwork.mockReset();
  });

  it("does not refetch on mount while already online", () => {
    mockNetwork.mockReturnValue(online);
    render(<Probe isStale retry={retry} />);

    expect(retry).not.toHaveBeenCalled();
  });

  it("does not refetch while still offline", () => {
    mockNetwork.mockReturnValue(offline);
    const { rerender } = render(<Probe isStale retry={retry} />);
    rerender(<Probe isStale retry={retry} />);

    expect(retry).not.toHaveBeenCalled();
  });

  it("refetches once when connectivity returns and the data is a fallback", () => {
    mockNetwork.mockReturnValue(offline);
    const { rerender } = render(<Probe isStale retry={retry} />);

    mockNetwork.mockReturnValue(online);
    rerender(<Probe isStale retry={retry} />);

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("leaves real data alone when connectivity returns", () => {
    mockNetwork.mockReturnValue(offline);
    const { rerender } = render(<Probe isStale={false} retry={retry} />);

    mockNetwork.mockReturnValue(online);
    rerender(<Probe isStale={false} retry={retry} />);

    expect(retry).not.toHaveBeenCalled();
  });

  // The point of the ref: after a refetch succeeds `isStale` flips to false,
  // which must not itself re-run the effect and fire a second time.
  it("fires once per outage, not once per render", () => {
    mockNetwork.mockReturnValue(offline);
    const { rerender } = render(<Probe isStale retry={retry} />);

    mockNetwork.mockReturnValue(online);
    rerender(<Probe isStale retry={retry} />);
    rerender(<Probe isStale={false} retry={retry} />);
    rerender(<Probe isStale={false} retry={retry} />);

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("fires again on a second outage", () => {
    mockNetwork.mockReturnValue(offline);
    const { rerender } = render(<Probe isStale retry={retry} />);

    mockNetwork.mockReturnValue(online);
    rerender(<Probe isStale retry={retry} />);

    mockNetwork.mockReturnValue(offline);
    rerender(<Probe isStale retry={retry} />);

    mockNetwork.mockReturnValue(online);
    rerender(<Probe isStale retry={retry} />);

    expect(retry).toHaveBeenCalledTimes(2);
  });
});
