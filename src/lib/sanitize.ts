import DOMPurify from 'isomorphic-dompurify'; // isomorphic = works in SSR + browser
export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);
