import { memoize } from 'es-toolkit/function';
import { HOWLER_SUPPORTED_FILE_FORMATS, SUPPORTED_IMAGE_FILE_FORMATS } from '../constants';
import { isCSSImageURL } from './assertions';
import { DEV } from 'esm-env';

const getUrlFileExtension = (address: string) => {
	try {
		const { pathname } = new URL(address, location.href);

		/**
		 * By using pathname we remove search params from URL, but some things are still preserved
		 *
		 * Imagine pathname like `image.png!private:1230`
		 */
		return pathname.split('.').at(-1)!.split('!')[0].split(':')[0];
	} catch (error) {
		if (DEV) {
			console.error(new Error(`Could not construct URL "${address}".`, { cause: error }));
		}

		return '';
	}
};

const fetchContentType = async (url: string, request: typeof fetch) => {
	try {
		const response = await request(url, {
			method: 'HEAD',
		});

		return response.headers.get('Content-Type') || '';
	} catch (error) {
		if (DEV) {
			console.error(new Error(`Failed to fetch file at "${url}"`, { cause: error }));
		}

		return '';
	}
};

type GetResourceTypeParams = {
	url: string;
	request: typeof fetch;
};

const getResourseType = memoize(
	async ({ url, request }: GetResourceTypeParams) => {
		/**
		 * If url is not http we should not check
		 *
		 * startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data')
		 */
		if (!isCSSImageURL(url)) {
			return 'other';
		}

		const extension = getUrlFileExtension(url);

		if (HOWLER_SUPPORTED_FILE_FORMATS.has(extension as any)) {
			return 'audio';
		}

		if (SUPPORTED_IMAGE_FILE_FORMATS.has(extension as any)) {
			return 'image';
		}

		/**
		 * If checks above didn't worked we will fetch content type
		 * This might not work because of CORS
		 */
		const contentType = await fetchContentType(url, request);

		if (contentType.includes('audio')) {
			return 'audio';
		}

		if (contentType.includes('image')) {
			return 'image';
		}

		return 'other';
	},
	{
		getCacheKey: ({ url }) => url,
	},
);

export { getUrlFileExtension, getResourseType, fetchContentType };

export type { GetResourceTypeParams };
