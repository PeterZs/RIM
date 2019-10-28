#version 450

#include "../Reusable/math_constants.glsl"
#include "../Reusable/intersection.glsl"

uniform mat4 mvp;
uniform mat4 mMatrix;
uniform mat4 vMatrix;
uniform mat4 pMatrix;

uniform bool viewAlign = false;
uniform float scale = 1.0;

uniform sampler2D sceneDepthTex;
uniform sampler2D quadTex;
uniform bool      quadTexAvailable = false;
uniform vec3      cameraPos;
uniform vec3	  cameraUp;
uniform vec3      cameraRight;

layout( location = 0) out vec4 o_normal;
layout( location = 1) out vec4 o_geom;

in vec2 gl_PointCoord;
in vec3 gl_FragCoord;

in vData
{
	vec3 InstancePos;
	float PointSize;
	flat int Instance;
} In;

vec2 rotAround(vec2 v, vec2 axis, float theta)
{
	float c = cos(theta), s = sin(theta);
	v = v - axis;
	v = vec2(c * v.x - s * v.y, s * v.x + c * v.y);
	v = v + axis;
	return v;
}

#define MOD_DEPTH 0

void main()
{
	if (texelFetch(sceneDepthTex, ivec2(gl_FragCoord.xy), 0).x < gl_FragCoord.z) discard;

	const vec2 texCoord = gl_PointCoord.st;

 	vec3 wsPos = In.InstancePos + 2.0 * scale * ((texCoord.s-0.5) * cameraRight + (texCoord.t-0.5) * cameraUp);
	o_geom   = vec4(wsPos, 1.f);

	float radius = distance(texCoord, vec2(0.5, 0.5));
	
	if (radius >= 0.5) discard;
	if (quadTexAvailable && texture(quadTex, rotAround(texCoord, vec2(0.5, 0.5), In.Instance * 341.41284912) ).x > 0.5 ) discard;

	const vec3 rd = normalize(wsPos-cameraPos);
	const float t = sphereIntersect(cameraPos, rd, vec4(In.InstancePos, scale));
	if (t < 0) discard;
	wsPos = cameraPos + t * rd;

	vec3 normal = normalize(wsPos-In.InstancePos);

	o_normal = vec4(normal, 1.f); 
	o_geom   = vec4(wsPos, 1.f);

#if MOD_DEPTH
	vec4 csPos = pMatrix * vMatrix * vec4(wsPos, 1.0);
	float depth = (csPos.z /  csPos.w) * 0.5 + 0.5;
	if (depth < 0.0 || depth > 1.0) discard;
	gl_FragDepth = (csPos.z /  csPos.w) * 0.5 + 0.5;
#endif
	 
}
