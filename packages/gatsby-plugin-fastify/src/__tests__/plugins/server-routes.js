import { FG_MODULE_HEADER } from "../../utils/headers";

describe(`Test Gatsby DSG/SSR Routes`, () => {
  describe("DSG", () => {
    it(`Should serve DSG route HTML no slash`, async () => {
      const response = await fastify.inject({
        url: "/generated/page-6",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.payload).toContain("<div>Hello world #<!-- -->6<!-- -->!</div>");
    });

    it(`Should serve DSG route HTML with slash`, async () => {
      const response = await fastify.inject({
        url: "/generated/page-6/",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.payload).toContain("<div>Hello world #<!-- -->6<!-- -->!</div>");
    });

    it(`Should serve DSG route "page-data.json"`, async () => {
      const response = await fastify.inject({
        url: "/page-data/generated/page-6/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.headers["content-type"]).toEqual("application/json; charset=utf-8");
      expect(response.payload).toContain(`"result":{"pageContext":{"pageNumber":6}}`);
    });
  });

  describe("SSR", () => {
    it(`Should serve SSR route HTML no slash`, async () => {
      const response = await fastify.inject({
        url: "/ssr",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.payload).toContain("SSR Page with Dogs");
    });

    it(`Should serve SSR route HTML with slash`, async () => {
      const response = await fastify.inject({
        url: "/ssr/",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.payload).toContain("SSR Page with Dogs");
    });

    it(`Should serve SSR route "page-data.json"`, async () => {
      const response = await fastify.inject({
        url: "/page-data/ssr/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.headers["content-type"]).toEqual("application/json; charset=utf-8");
      expect(response.payload).toContain(`"path":"/ssr/","result":{"serverData"`);
    });

    it(`Should serve SSR route "page-data.json" with custom headers`, async () => {
      const response = await fastify.inject({
        url: "/page-data/ssr/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["x-test"]).toEqual("Custom Headers Work!");
    });

    it(`Should throw 500 error on exception when fetching server data`, async () => {
      const response = await fastify.inject({
        url: "/ssrBad",
        method: "GET",
      });

      expect(response.statusCode).toEqual(500);
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    });

    it(`Should Add custom headers to SSR routes`, async () => {
      const response = await fastify.inject({
        url: "/ssr",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["x-test"]).toEqual("Custom Headers Work!");
      expect(response.payload).toContain("SSR Page with Dogs");
    });

    it(`Should serve SSR page from a parametric route`, async () => {
      const meaningfulResponse = await fastify.inject({
        url: "/ssr/42",
        method: "GET",
      });

      expect(meaningfulResponse.statusCode).toEqual(200);
      expect(meaningfulResponse.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(meaningfulResponse.payload).toContain("meaning of life");

      const meaninglessResponse = await fastify.inject({
        url: "/ssr/43",
        method: "GET",
      });

      expect(meaninglessResponse.statusCode).toEqual(200);
      expect(meaninglessResponse.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(meaninglessResponse.payload).toContain("try again");
    });
  });

  it(`Should 400 if request does not accept "text/html" on DSG/SSR route`, async () => {
    const response = await fastify.inject({
      url: "/ssr",
      method: "GET",
      headers: {
        accept: "text/plain",
      },
    });

    expect(response.statusCode).toEqual(400);
  });

  it(`Should throw 404 if bad /page-data/route`, async () => {
    const response = await fastify.inject({
      url: "/page-data/fsdfsd/page-data.json",
      method: "GET",
    });

    expect(response.statusCode).toEqual(404);
  });

  it(`Should throw returned status code from getServer Data for HTML`, async () => {
    const response = await fastify.inject({
      url: "/ssr403",
      method: "GET",
    });

    expect(response.statusCode).toEqual(403);
  });

  it(`Should throw returned status code from getServer Data for page-data.json`, async () => {
    const response = await fastify.inject({
      url: "/page-data/ssr403/page-data.json",
      method: "GET",
    });

    expect(response.statusCode).toEqual(403);
  });

  it(`Should return route correctly when queryparams exist`, async () => {
    const response = await fastify.inject({
      url: "/ssr?test=test",
      method: "GET",
    });

    expect(response.statusCode).toEqual(200);
  });

  it(`Should return route html correctly when splat route`, async () => {
    const response = await fastify.inject({
      url: "/ssr_splat/example/test",
      method: "GET",
    });

    expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("&quot;*&quot;: &quot;example/test&quot;");
  });

  it(`Should return route page-data.json correctly when splat route`, async () => {
    const response = await fastify.inject({
      url: "/page-data/ssr_splat/[...]/page-data.json",
      method: "GET",
    });

    expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    expect(response.headers["content-type"]).toContain("json");
    expect(response.statusCode).toEqual(200);
  });

  it(`Should return route html correctly when named splat route`, async () => {
    const response = await fastify.inject({
      url: "/ssr_named_splat/example/test",
      method: "GET",
    });

    expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("&quot;test&quot;: &quot;example/test&quot;");
  });

  it(`Should return route page-data.json correctly when named splat route`, async () => {
    const response = await fastify.inject({
      url: "/page-data/ssr_named_splat/[...test]/page-data.json",
      method: "GET",
    });

    expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    expect(response.headers["content-type"]).toContain("json");
    expect(response.statusCode).toEqual(200);
  });

  // dsg routes should also get custom headers
  it(`Should Add custom headers to DSG routes`, async () => {
    const response = await fastify.inject({
      url: "/faker",
      method: "GET",
    });

    expect(response.statusCode).toEqual(200);
    expect(response.headers).toHaveProperty("x-test-all-pages");
  });

  // ssr routes should also get custom headers
  it(`Should Add custom headers to SSR routes alongside SSR headers`, async () => {
    const response = await fastify.inject({
      url: "/ssr",
      method: "GET",
    });

    expect(response.statusCode).toEqual(200);
    expect(response.headers).toHaveProperty("x-test-all-pages");
    expect(response.headers).toHaveProperty("x-test", "Custom Headers Work!");
  });

  // ssr headers set in SSR file should overwrite custom headers
  it(`Should overwrite custom headers in SSR paths with headers set in the SSR file`, async () => {
    const response = await fastify.inject({
      url: "/ssr",
      method: "GET",
    });

    expect(response.statusCode).toEqual(200);
    expect(response.headers).toHaveProperty("x-test-ssr-kept", "ssr page");
    expect(response.headers).toHaveProperty("x-test-ssr-overwrite", "Overwritten by SSR");
  });
});
