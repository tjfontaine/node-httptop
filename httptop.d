#!/usr/sbin/dtrace -s

node*::http-server-request
{
  m = copyinstr(arg4);
  u = copyinstr(arg5);

  @counts[u, m] = count();

  interest[pid, arg6] = timestamp;
  url[pid, arg6] = u;
  method[pid, arg6] = m;
}

node*::http-server-response
/interest[pid, arg3]/
{
  u = url[pid, arg3];
  m = method[pid, arg3];
  t = interest[pid, arg3];

  @url_latency[u, m] = quantize(timestamp - t);

  url[pid, arg3] = 0;
  method[pid, arg3] = 0;
  interest[pid, arg3] = 0;
}

tick-1s
{
  printf("### count\n");
  printa(@counts);
  printf("### count\n");
}

tick-1s
{
  printf("### latency\n");
  printa(@url_latency);
  printf("### latency\n");
}
