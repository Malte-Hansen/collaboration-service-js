# ExplorViz + ARENA2

To initiate the spectate / synchronization feature within ARENA2:

1) All five frontend instances, i.e. Main and five projectors, need to adress the same roomId and tokenId, while identiying themselves uniquely with a corresponding deviceId.
2) The .env in the frontend should contain the IP-adress of the Main and not localhost
3) Use the script in the ARENA2 to set up Frontend and Collaboration Service. It also provides the ExplorViz instance for the Main, which is the automatically starting google chrome web browser
4) All projector instances need to be in full screen, otherwise the graphical manipulation of the software landscape is off


The `arena-2.json` contains the computed projection matrices for the devices.

Configure and run the `arena-2-matrix-calculation.html` with Google Chrome and copy the results from the browser console to get new projection matrices for the devices.