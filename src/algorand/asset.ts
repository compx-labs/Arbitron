import axios from "axios";

export async function getAssetInformation(assetIds: number[]) {
    try {
        const compxResponse = await axios.post(`${process.env.COMPX_BACKEND_API_URL}/assets`,
            {
                assetIds: assetIds
            }
        );
        if (compxResponse.status !== 200) {
            throw new Error('Failed to get asset information');
        } else {
            return compxResponse.data;
        }
    } catch (error) {
        console.error('Failed to get asset information', error);
    }
}